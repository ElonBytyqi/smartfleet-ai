"""SmartFleet AI Service — analiza dhe parashikime."""

import os

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import anomaly
import predictive

load_dotenv()

API_KEY = os.getenv("API_KEY", "dev-key")

app = FastAPI(
    title="SmartFleet AI Service",
    description="Predictive maintenance, anomaly detection dhe analiza raportesh",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://localhost:7017"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def verify_key(x_api_key: str = Header(default="")):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")


@app.get("/health")
def health():
    from db import pg_query, telemetry

    try:
        pg_query("SELECT 1")
        pg_ok = True
    except Exception:
        pg_ok = False

    try:
        count = telemetry.count_documents({})
        mongo_ok = True
    except Exception:
        count, mongo_ok = 0, False

    return {
        "status": "ok" if pg_ok and mongo_ok else "degraded",
        "postgres": pg_ok,
        "mongo": mongo_ok,
        "telemetryPoints": count,
    }


@app.get("/predictive/fleet", dependencies=[Depends(verify_key)])
def fleet_risk():
    """Risk score për të gjithë flotën, i renditur."""
    return predictive.assess_fleet()


@app.get("/predictive/drones/{drone_id}", dependencies=[Depends(verify_key)])
def drone_risk(drone_id: str):
    """Vlerësim i detajuar për një dron."""
    result = predictive.assess_drone(drone_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result



@app.get("/anomalies/missions/{mission_id}", dependencies=[Depends(verify_key)])
def mission_anomalies(mission_id: str):
    """Analizon telemetrinë e një misioni."""
    result = anomaly.analyze_mission(mission_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@app.get("/anomalies/recent", dependencies=[Depends(verify_key)])
def recent(days: int = 14, limit: int = 50):
    """Misionet e fundit me anomali, të renditura sipas shëndetit."""
    return anomaly.recent_anomalies(days, limit)