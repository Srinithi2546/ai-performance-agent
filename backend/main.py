from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import List, Dict, Optional
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from ai_service import analyze_metrics, analyze_deployment
import json
import asyncio
from collections import defaultdict

# ============================================
# Data Stores (In-Memory for Demo)
# In production, use PostgreSQL + Redis
# ============================================

# Time-series metrics storage (last 100 per type)
metrics_history: Dict[str, List[dict]] = defaultdict(list)

# Error logs
errors_store: List[dict] = []

# Sessions tracking
sessions: Dict[str, dict] = {}

# WebSocket connections for live updates
connected_clients: List[WebSocket] = []

# AI analysis cache
latest_analysis: Dict[str, str] = {
    "metrics": "Analyzing frontend telemetry...",
    "deployment": "Awaiting deployment data...",
}

# Baseline snapshot for deployment analysis
baseline_snapshot = {
    "LCP": 2.1,
    "CLS": 0.04,
    "INP": 180.0,
    "errors": 0
}

# Deployment info
deployment_info = {
    "version": "v2.1.4",
    "commit": "a9f21d4",
    "status": "Successful",
    "deployed_at": datetime.now().isoformat(),
    "environment": "Production",
    "region": "AP-SOUTH-1",
}

# ============================================
# FastAPI Setup
# ============================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[START] PulseGuard AI Backend Started")
    yield
    print("[STOP] PulseGuard AI Backend Stopped")

app = FastAPI(title="PulseGuard AI", version="1.0.0", lifespan=lifespan)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# ============================================
# Health & Status Endpoints
# ============================================

@app.get("/")
async def home():
    """Health check endpoint"""
    return {
        "message": "PulseGuard AI Backend Running",
        "status": "operational",
        "version": "1.0.0",
        "sessions": len(sessions),
        "metrics_count": sum(len(v) for v in metrics_history.values()),
        "errors_count": len(errors_store),
    }

# ============================================
# Metrics Endpoint
# ============================================


@app.post("/metrics")
async def receive_metrics(data: dict):
    """
    Receive metrics from SDK.
    
    Accepts:
    - Web Vitals (LCP, CLS, INP)
    - API calls and failures
    - JS errors
    - Custom events
    """
    try:
        # Add timestamp and metadata
        metric_data = {
            **data,
            "received_at": datetime.now().isoformat(),
        }
        
        # Track session
        session_id = data.get("sessionId", "unknown")
        if session_id not in sessions:
            sessions[session_id] = {
                "created": datetime.now().isoformat(),
                "url": data.get("url", ""),
                "metrics_count": 0,
                "errors_count": 0,
            }
        sessions[session_id]["metrics_count"] += 1
        sessions[session_id]["last_activity"] = datetime.now().isoformat()
        
        # Store metric with history limit (keep last 100)
        metric_type = data.get("type", "unknown")
        metrics_history[metric_type].append(metric_data)
        if len(metrics_history[metric_type]) > 100:
            metrics_history[metric_type].pop(0)
        
        # Log metric
        metric_name = data.get("name", "unknown")
        metric_value = data.get("value", data.get("resource", ""))
        print(f"[METRIC] {metric_type.upper()}: {metric_name} = {metric_value}")
        
        # Trigger AI analysis if needed
        await check_and_trigger_analysis()
        
        # Broadcast to connected clients
        await broadcast({
            "type": "metric",
            "data": metric_data,
            "summary": get_dashboard_summary()
        })
        
        return {"status": "received", "sessionId": session_id}
    
    except Exception as e:
        print(f"[ERROR] Error processing metric: {e}")
        return {"status": "error", "message": str(e)}

# ============================================
# Error Tracking
# ============================================

@app.post("/errors")
async def receive_errors(data: dict):
    """Receive error reports from SDK"""
    try:
        error_data = {
            **data,
            "received_at": datetime.now().isoformat(),
        }
        
        # Track in session
        session_id = data.get("sessionId", "unknown")
        if session_id in sessions:
            sessions[session_id]["errors_count"] += 1
        
        # Store error
        errors_store.append(error_data)
        if len(errors_store) > 500:  # Keep last 500 errors
            errors_store.pop(0)
        
        # Log error
        error_msg = data.get("message", data.get("name", "Unknown"))
        print(f"[WARN] ERROR: {error_msg}")
        
        # Trigger AI analysis
        await check_and_trigger_analysis()
        
        # Broadcast to clients
        await broadcast({
            "type": "error",
            "data": error_data,
            "summary": get_dashboard_summary()
        })
        
        return {"status": "received"}
    
    except Exception as e:
        print(f"[ERROR] Error processing error report: {e}")
        return {"status": "error", "message": str(e)}

# ============================================
# Dashboard Data Endpoint
# ============================================

@app.get("/dashboard")
async def get_dashboard():
    """Get complete dashboard data"""
    return {
        "summary": get_dashboard_summary(),
        "metrics": {
            "recent_vitals": get_recent_vitals(),
            "api_stats": get_api_stats(),
            "error_stats": get_error_stats(),
        },
        "errors": errors_store[-20:],  # Last 20 errors
        "sessions": list(sessions.values())[-10:],  # Last 10 sessions
        "ai_analysis": latest_analysis["metrics"],
        "timestamp": datetime.now().isoformat(),
    }

# ============================================
# Deployment Analysis Endpoint
# ============================================

@app.get("/deployments")
async def get_deployments():
    """Get deployment analysis with performance comparison"""
    
    # Get current metrics
    current_vitals = get_recent_vitals()
    
    after = {
        "LCP": current_vitals.get("LCP", {}).get("value"),
        "CLS": current_vitals.get("CLS", {}).get("value"),
        "INP": current_vitals.get("INP", {}).get("value"),
        "errors": len(errors_store)
    }
    
    # Build comparison
    comparison = []
    for metric in ["LCP", "CLS", "INP", "errors"]:
        b_val = baseline_snapshot.get(metric, 0)
        a_val = after.get(metric, 0)
        
        if a_val is None:
            delta = None
        else:
            delta = a_val - b_val
        
        status = get_regression_status(metric, delta)
        
        comparison.append({
            "metric": metric,
            "before": b_val,
            "after": a_val,
            "delta": delta,
            "status": status,
        })
    
    # Determine risk level
    statuses = [c["status"] for c in comparison]
    risk_level = "Low"
    if "Critical" in statuses:
        risk_level = "Critical"
    elif "Warning" in statuses:
        risk_level = "Warning"
    
    # Trigger AI analysis for deployment
    ai_analysis = latest_analysis["deployment"]
    if any(v is not None for v in after.values()):
        try:
            ai_analysis = analyze_deployment(
                deployment_info["version"],
                baseline_snapshot,
                after,
                comparison
            )
            latest_analysis["deployment"] = ai_analysis
        except Exception as e:
            print(f"AI analysis error: {e}")
    
    return {
        "deployment": deployment_info,
        "baseline": baseline_snapshot,
        "after": after,
        "comparison": comparison,
        "risk_level": risk_level,
        "ai_analysis": ai_analysis,
        "timestamp": datetime.now().isoformat(),
    }

# ============================================
# WebSocket for Real-Time Updates
# ============================================

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time dashboard updates"""
    await websocket.accept()
    connected_clients.append(websocket)
    print(f"[CONNECTED] Client connected. Total: {len(connected_clients)}")
    
    try:
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        connected_clients.remove(websocket)
        print(f"[DISCONNECTED] Client disconnected. Total: {len(connected_clients)}")
    except Exception as e:
        print(f"WebSocket error: {e}")
        if websocket in connected_clients:
            connected_clients.remove(websocket)

# ============================================
# Helper Functions
# ============================================

def get_dashboard_summary() -> dict:
    """Get aggregated dashboard summary"""
    vitals = get_recent_vitals()
    return {
        "lcp": vitals.get("LCP", {}),
        "cls": vitals.get("CLS", {}),
        "inp": vitals.get("INP", {}),
        "errors": {
            "count": len(errors_store),
            "recent": len([e for e in errors_store if is_recent(e.get("received_at"))]),
        },
        "sessions": {
            "total": len(sessions),
            "active": len([s for s in sessions.values() if is_recent(s.get("last_activity"))]),
        },
        "timestamp": datetime.now().isoformat(),
    }

def get_recent_vitals() -> dict:
    """Get latest Web Vitals"""
    vitals = {}
    
    for vital_type in ["LCP", "CLS", "INP"]:
        web_vital_metrics = [
            m for m in metrics_history.get("web_vital", [])
            if m.get("name") == vital_type
        ]
        
        if web_vital_metrics:
            latest = web_vital_metrics[-1]
            vitals[vital_type] = {
                "value": latest.get("value"),
                "rating": latest.get("rating"),
                "delta": latest.get("delta"),
                "timestamp": latest.get("received_at"),
            }
    
    return vitals

def get_api_stats() -> dict:
    """Get API performance statistics"""
    api_calls = metrics_history.get("api", [])
    api_errors = metrics_history.get("api_error", [])
    
    total_calls = len(api_calls)
    failed_calls = len(api_errors)
    success_rate = ((total_calls - failed_calls) / total_calls * 100) if total_calls > 0 else 100
    
    avg_duration = 0
    if api_calls:
        avg_duration = sum(c.get("duration", 0) for c in api_calls) / len(api_calls)
    
    return {
        "total_calls": total_calls,
        "failed_calls": failed_calls,
        "success_rate": success_rate,
        "avg_duration_ms": avg_duration,
        "recent_errors": api_errors[-5:],
    }

def get_error_stats() -> dict:
    """Get error statistics"""
    js_errors = len([e for e in errors_store if e.get("type") == "js_error"])
    api_errors = len([e for e in errors_store if e.get("type") == "api_error"])
    rejections = len([e for e in errors_store if e.get("type") == "unhandled_rejection"])
    
    return {
        "js_errors": js_errors,
        "api_errors": api_errors,
        "unhandled_rejections": rejections,
        "total": len(errors_store),
        "recent": [e for e in errors_store if is_recent(e.get("received_at"))][-5:],
    }

def get_regression_status(metric: str, delta: Optional[float]) -> str:
    """Determine regression status"""
    if delta is None:
        return "No Data"
    
    thresholds = {
        "LCP": (0.5, 1.0),
        "CLS": (0.05, 0.15),
        "INP": (50, 150),
        "errors": (1, 5),
    }
    
    warn, crit = thresholds.get(metric, (0, 0))
    
    if delta <= 0:
        return "Improved"
    elif delta < warn:
        return "Stable"
    elif delta < crit:
        return "Warning"
    else:
        return "Critical"

def is_recent(timestamp: Optional[str], minutes: int = 5) -> bool:
    """Check if timestamp is within last N minutes"""
    if not timestamp:
        return False
    try:
        dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        return datetime.now(dt.tzinfo) - dt < timedelta(minutes=minutes)
    except:
        return False

async def broadcast(message: dict):
    """Broadcast message to all connected WebSocket clients"""
    disconnected = []
    for client in connected_clients:
        try:
            await client.send_json(message)
        except Exception as e:
            disconnected.append(client)
    
    for client in disconnected:
        if client in connected_clients:
            connected_clients.remove(client)

async def check_and_trigger_analysis():
    """Check if AI analysis should be triggered"""
    vitals = get_recent_vitals()
    error_count = len(errors_store)
    
    lcp = vitals.get("LCP", {}).get("value", 0)
    cls = vitals.get("CLS", {}).get("value", 0)
    inp = vitals.get("INP", {}).get("value", 0)
    
    needs_analysis = lcp > 2.5 or cls > 0.1 or inp > 200 or error_count > 0
    
    if needs_analysis:
        try:
            # Run AI analysis in background
            asyncio.create_task(run_ai_analysis())
        except Exception as e:
            print(f"Failed to trigger AI analysis: {e}")

async def run_ai_analysis():
    """Run AI analysis on current metrics"""
    try:
        recent_errors = errors_store[-10:]
        recent_metrics = [
            m for m in metrics_history.get("web_vital", [])[-10:]
        ]
        
        if recent_metrics:
            analysis = analyze_metrics(recent_metrics, recent_errors)
            latest_analysis["metrics"] = analysis
            
            # Broadcast analysis
            await broadcast({
                "type": "analysis",
                "data": {
                    "analysis": analysis,
                    "timestamp": datetime.now().isoformat()
                }
            })
    except Exception as e:
        print(f"AI analysis error: {e}")


# ============================================
# Main Entry Point
# ============================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
