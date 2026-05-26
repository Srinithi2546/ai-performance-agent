from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import List, Dict, Optional
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from ai_service import analyze_metrics, analyze_deployment
from collections import defaultdict
from fastapi.responses import FileResponse
from pydantic import BaseModel
import asyncio
import os

# ============================================
# Pydantic Models
# ============================================

class Metrics(BaseModel):
    type: Optional[str] = None
    name: Optional[str] = None
    value: Optional[Any] = None
    rating: Optional[str] = None
    delta: Optional[Any] = None
    sessionId: Optional[str] = None
    url: Optional[str] = None
    resource: Optional[str] = None
    duration: Optional[Any] = None


class ErrorData(BaseModel):
    type: Optional[str] = None
    name: Optional[str] = None
    message: Optional[str] = None
    stack: Optional[str] = None
    sessionId: Optional[str] = None
    url: Optional[str] = None


# ============================================
# Data Stores (In-Memory for Demo)
# ============================================

metrics_history: Dict[str, List[dict]] = defaultdict(list)

errors_store: List[dict] = []

sessions: Dict[str, dict] = {}

connected_clients: List[WebSocket] = []

latest_analysis: Dict[str, str] = {
    "metrics": "Analyzing frontend telemetry...",
    "deployment": "Awaiting deployment data...",
}

baseline_snapshot = {
    "LCP": 2.1,
    "CLS": 0.04,
    "INP": 180.0,
    "errors": 0
}

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

app = FastAPI(
    title="PulseGuard AI",
    version="1.0.0",
    lifespan=lifespan
)

# ============================================
# CORS
# ============================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# Health Endpoint
# ============================================

@app.get("/")
async def home():
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
async def receive_metrics(data: Metrics):

    try:
        data = data.dict()

        metric_data = {
            **data,
            "received_at": datetime.now().isoformat(),
        }

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

        metric_type = data.get("type", "unknown")

        metrics_history[metric_type].append(metric_data)

        if len(metrics_history[metric_type]) > 100:
            metrics_history[metric_type].pop(0)

        metric_name = data.get("name", "unknown")
        metric_value = data.get("value", data.get("resource", ""))

        print(f"[METRIC] {metric_type}: {metric_name} = {metric_value}")

        await check_and_trigger_analysis()

        await broadcast({
            "type": "metric",
            "data": metric_data,
            "summary": get_dashboard_summary()
        })

        return {
            "status": "received",
            "sessionId": session_id
        }

    except Exception as e:
        print(f"[ERROR] Metrics Error: {e}")

        return {
            "status": "error",
            "message": str(e)
        }

# ============================================
# Error Tracking Endpoint
# ============================================

@app.post("/errors")
async def receive_errors(data: ErrorData):

    try:
        data = data.dict()

        error_data = {
            **data,
            "received_at": datetime.now().isoformat(),
        }

        session_id = data.get("sessionId", "unknown")

        if session_id in sessions:
            sessions[session_id]["errors_count"] += 1

        errors_store.append(error_data)

        if len(errors_store) > 500:
            errors_store.pop(0)

        error_msg = data.get("message", "Unknown Error")

        print(f"[ERROR] {error_msg}")

        await check_and_trigger_analysis()

        await broadcast({
            "type": "error",
            "data": error_data,
            "summary": get_dashboard_summary()
        })

        return {"status": "received"}

    except Exception as e:
        print(f"[ERROR] Error Endpoint Failed: {e}")

        return {
            "status": "error",
            "message": str(e)
        }

# ============================================
# Dashboard Endpoint
# ============================================

@app.get("/dashboard")
async def get_dashboard():

    return {
        "summary": get_dashboard_summary(),
        "metrics": {
            "recent_vitals": get_recent_vitals(),
            "api_stats": get_api_stats(),
            "error_stats": get_error_stats(),
        },
        "errors": errors_store[-20:],
        "sessions": list(sessions.values())[-10:],
        "ai_analysis": latest_analysis["metrics"],
        "timestamp": datetime.now().isoformat(),
    }

# ============================================
# Deployment Endpoint
# ============================================

@app.get("/deployments")
async def get_deployments():

    current_vitals = get_recent_vitals()

    after = {
        "LCP": current_vitals.get("LCP", {}).get("value"),
        "CLS": current_vitals.get("CLS", {}).get("value"),
        "INP": current_vitals.get("INP", {}).get("value"),
        "errors": len(errors_store)
    }

    comparison = []

    for metric in ["LCP", "CLS", "INP", "errors"]:

        b_val = baseline_snapshot.get(metric, 0)
        a_val = after.get(metric, 0)

        delta = None if a_val is None else a_val - b_val

        status = get_regression_status(metric, delta)

        comparison.append({
            "metric": metric,
            "before": b_val,
            "after": a_val,
            "delta": delta,
            "status": status,
        })

    statuses = [c["status"] for c in comparison]

    risk_level = "Low"

    if "Critical" in statuses:
        risk_level = "Critical"

    elif "Warning" in statuses:
        risk_level = "Warning"

    ai_analysis = latest_analysis["deployment"]

    try:
        ai_analysis = analyze_deployment(
            deployment_info["version"],
            baseline_snapshot,
            after,
            comparison
        )

        latest_analysis["deployment"] = ai_analysis

    except Exception as e:
        print(f"AI Deployment Analysis Error: {e}")

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
# SDK Endpoint
# ============================================

@app.get("/sdk.js")
async def sdk():
    return FileResponse("sdk.js")

# ============================================
# WebSocket Endpoint
# ============================================

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):

    await websocket.accept()

    connected_clients.append(websocket)

    print(f"[CONNECTED] Total Clients: {len(connected_clients)}")

    try:
        while True:

            data = await websocket.receive_text()

            if data == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:

        if websocket in connected_clients:
            connected_clients.remove(websocket)

        print(f"[DISCONNECTED] Total Clients: {len(connected_clients)}")

    except Exception as e:

        print(f"WebSocket Error: {e}")

        if websocket in connected_clients:
            connected_clients.remove(websocket)

# ============================================
# Helper Functions
# ============================================

def get_dashboard_summary():

    vitals = get_recent_vitals()

    return {
        "lcp": vitals.get("LCP", {}),
        "cls": vitals.get("CLS", {}),
        "inp": vitals.get("INP", {}),
        "errors": {
            "count": len(errors_store),
        },
        "sessions": {
            "total": len(sessions),
        },
        "timestamp": datetime.now().isoformat(),
    }

def get_recent_vitals():

    vitals = {}

    for vital_type in ["LCP", "CLS", "INP"]:

        metrics = [
            m for m in metrics_history.get("web_vital", [])
            if m.get("name") == vital_type
        ]

        if metrics:

            latest = metrics[-1]

            vitals[vital_type] = {
                "value": latest.get("value"),
                "rating": latest.get("rating"),
                "delta": latest.get("delta"),
                "timestamp": latest.get("received_at"),
            }

    return vitals

def get_api_stats():

    api_calls = metrics_history.get("api", [])
    api_errors = metrics_history.get("api_error", [])

    total_calls = len(api_calls)
    failed_calls = len(api_errors)

    success_rate = (
        ((total_calls - failed_calls) / total_calls) * 100
        if total_calls > 0 else 100
    )

    avg_duration = 0

    if api_calls:
        avg_duration = sum(
            c.get("duration", 0)
            for c in api_calls
        ) / len(api_calls)

    return {
        "total_calls": total_calls,
        "failed_calls": failed_calls,
        "success_rate": success_rate,
        "avg_duration_ms": avg_duration,
    }

def get_error_stats():

    return {
        "total": len(errors_store),
        "recent": errors_store[-5:]
    }

def get_regression_status(metric: str, delta: Optional[float]):

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

async def broadcast(message: dict):

    disconnected = []

    for client in connected_clients:

        try:
            await client.send_json(message)

        except Exception:
            disconnected.append(client)

    for client in disconnected:

        if client in connected_clients:
            connected_clients.remove(client)

async def check_and_trigger_analysis():

    vitals = get_recent_vitals()

    lcp = vitals.get("LCP", {}).get("value", 0)
    cls = vitals.get("CLS", {}).get("value", 0)
    inp = vitals.get("INP", {}).get("value", 0)

    if lcp > 2.5 or cls > 0.1 or inp > 200:

        try:
            asyncio.create_task(run_ai_analysis())

        except Exception as e:
            print(f"AI Trigger Error: {e}")

async def run_ai_analysis():

    try:

        recent_errors = errors_store[-10:]

        recent_metrics = metrics_history.get(
            "web_vital",
            []
        )[-10:]

        if recent_metrics:

            analysis = analyze_metrics(
                recent_metrics,
                recent_errors
            )

            latest_analysis["metrics"] = analysis

            await broadcast({
                "type": "analysis",
                "data": {
                    "analysis": analysis,
                    "timestamp": datetime.now().isoformat()
                }
            })

    except Exception as e:
        print(f"AI Analysis Error: {e}")

# ============================================
# Main
# ============================================

if __name__ == "__main__":

    import uvicorn

    port = int(os.environ.get("PORT", 8000))

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level="info"
    )
