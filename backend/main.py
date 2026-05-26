from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from datetime import datetime
from collections import defaultdict
from ai_service import analyze_metrics, analyze_deployment
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
# In-Memory Storage
# ============================================

metrics_history: Dict[str, List[dict]] = defaultdict(list)
errors_store: List[dict] = []
sessions: Dict[str, dict] = {}

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
    print("PulseGuard Backend Started")
    yield
    print("PulseGuard Backend Stopped")


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
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# Root Endpoint
# ============================================

@app.get("/")
async def home():
    return {
        "message": "PulseGuard AI Backend Running",
        "status": "operational",
        "version": "1.0.0"
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
            }

        sessions[session_id]["metrics_count"] += 1

        metric_type = data.get("type", "unknown")

        metrics_history[metric_type].append(metric_data)

        if len(metrics_history[metric_type]) > 100:
            metrics_history[metric_type].pop(0)

        metric_name = data.get("name", "unknown")
        metric_value = data.get("value", "")

        print(f"[METRIC] {metric_name} = {metric_value}")

        await check_and_trigger_analysis()

        return {
            "status": "received",
            "sessionId": session_id
        }

    except Exception as e:
        print("Metrics Error:", e)

        return {
            "status": "error",
            "message": str(e)
        }

# ============================================
# Error Endpoint
# ============================================

@app.post("/errors")
async def receive_errors(data: ErrorData):

    try:
        data = data.dict()

        error_data = {
            **data,
            "received_at": datetime.now().isoformat(),
        }

        errors_store.append(error_data)

        if len(errors_store) > 500:
            errors_store.pop(0)

        print("[ERROR]", data.get("message"))

        return {"status": "received"}

    except Exception as e:
        print("Error Endpoint Failed:", e)

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

        before = baseline_snapshot.get(metric, 0)
        after_value = after.get(metric, 0)

        delta = None if after_value is None else after_value - before

        comparison.append({
            "metric": metric,
            "before": before,
            "after": after_value,
            "delta": delta,
        })

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
        print("Deployment Analysis Error:", e)

    return {
        "deployment": deployment_info,
        "comparison": comparison,
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
# Helper Functions
# ============================================

def get_dashboard_summary():

    vitals = get_recent_vitals()

    return {
        "lcp": vitals.get("LCP", {}),
        "cls": vitals.get("CLS", {}),
        "inp": vitals.get("INP", {}),
        "errors": len(errors_store),
        "sessions": len(sessions),
        "timestamp": datetime.now().isoformat(),
    }

def get_recent_vitals():

    vitals = {}

    for vital_type in ["LCP", "CLS", "INP"]:

        metric_list = [
            m for m in metrics_history.get("web_vital", [])
            if m.get("name") == vital_type
        ]

        if metric_list:

            latest = metric_list[-1]

            vitals[vital_type] = {
                "value": latest.get("value"),
                "rating": latest.get("rating"),
                "delta": latest.get("delta"),
            }

    return vitals

def get_api_stats():

    api_calls = metrics_history.get("api", [])

    total_calls = len(api_calls)

    avg_duration = 0

    if api_calls:
        avg_duration = sum(
            c.get("duration", 0)
            for c in api_calls
        ) / len(api_calls)

    return {
        "total_calls": total_calls,
        "avg_duration_ms": avg_duration,
    }

def get_error_stats():

    return {
        "total": len(errors_store),
        "recent": errors_store[-5:]
    }

async def check_and_trigger_analysis():

    try:
        asyncio.create_task(run_ai_analysis())

    except Exception as e:
        print("AI Trigger Error:", e)

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

    except Exception as e:
        print("AI Analysis Error:", e)

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
