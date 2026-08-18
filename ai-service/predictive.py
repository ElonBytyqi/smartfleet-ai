"""
Vlerëson rrezikun e defektit për çdo dron.

Qasja është e shtresuar:
  1. Faktorë të matshëm nga PostgreSQL (orë fluturimi, cikle baterie, histori)
  2. Sinjale nga telemetria e MongoDB (dridhje, temperaturë, konsum baterie)
  3. Krahasim me mesataren e modelit të njëjtë
"""

from datetime import datetime, timedelta, timezone

import numpy as np

from db import pg_query, telemetry
MAINTENANCE_COMPLETED = 2

# Peshat e faktorëve — shuma 100
WEIGHTS = {
    "flight_hours": 22,
    "days_since_service": 20,
    "battery_health": 14,
    "vibration": 16,
    "temperature": 8,
    "battery_drain": 10,
    "issue_history": 10,
}

# Pas sa orësh fluturimi rekomandohet servis i plotë
SERVICE_INTERVAL_HOURS = 120
SERVICE_INTERVAL_DAYS = 180


def _score(value: float, low: float, high: float) -> float:
    """Normalizon një vlerë në 0-1 mes dy pragjeve."""
    if high == low:
        return 0.0
    return float(np.clip((value - low) / (high - low), 0, 1))


def _telemetry_stats(drone_id: str, days: int = 30) -> dict:
    """Statistika nga telemetria e periudhës së fundit."""
    since = datetime.now(timezone.utc) - timedelta(days=days)

    cursor = telemetry.find(
        {"DroneId": drone_id, "Timestamp": {"$gte": since}},
        {
            "VibrationLevel": 1,
            "TemperatureCelsius": 1,
            "BatteryPercentage": 1,
            "MissionId": 1,
            "Timestamp": 1,
            "_id": 0,
        },
    )

    points = list(cursor)
    if not points:
        return {"has_data": False}

    vibrations = [p["VibrationLevel"] for p in points if p.get("VibrationLevel") is not None]
    temps = [p["TemperatureCelsius"] for p in points if p.get("TemperatureCelsius") is not None]

    # Konsumi mesatar i baterisë për minutë, sipas misioneve
    drain_rates = []
    by_mission: dict = {}
    for p in points:
        mid = p.get("MissionId")
        if mid:
            by_mission.setdefault(mid, []).append(p)

    for mission_points in by_mission.values():
        ordered = sorted(mission_points, key=lambda x: x["Timestamp"])
        if len(ordered) < 10:
            continue
        used = ordered[0]["BatteryPercentage"] - ordered[-1]["BatteryPercentage"]
        minutes = (ordered[-1]["Timestamp"] - ordered[0]["Timestamp"]).total_seconds() / 60
        if minutes > 1 and used > 0:
            drain_rates.append(used / minutes)

    return {
        "has_data": True,
        "point_count": len(points),
        "vibration_avg": float(np.mean(vibrations)) if vibrations else None,
        "vibration_p95": float(np.percentile(vibrations, 95)) if vibrations else None,
        "temperature_avg": float(np.mean(temps)) if temps else None,
        "temperature_max": float(np.max(temps)) if temps else None,
        "drain_rate": float(np.mean(drain_rates)) if drain_rates else None,
    }


def _fleet_drain_baseline(model_id: str) -> float | None:
    """Konsumi mesatar i baterisë për dronët e të njëjtit model."""
    drones = pg_query(
        'SELECT "Id" FROM "Drones" WHERE "DroneModelId" = %s', (model_id,)
    )

    rates = []
    for d in drones:
        stats = _telemetry_stats(str(d["Id"]), days=60)
        if stats.get("drain_rate"):
            rates.append(stats["drain_rate"])

    return float(np.median(rates)) if len(rates) >= 2 else None


def assess_drone(drone_id: str) -> dict:
    """Llogarit risk score-in për një dron."""

    rows = pg_query(
        """
        SELECT d."Id", d."SerialNumber", d."Nickname", d."Status",
               d."TotalFlightHours", d."PurchaseDate", d."DroneModelId",
               m."ModelName", m."ManufacturerName", m."MaxFlightTimeMinutes"
        FROM "Drones" d
        JOIN "DroneModels" m ON m."Id" = d."DroneModelId"
        WHERE d."Id" = %s
        """,
        (drone_id,),
    )

    if not rows:
        return {"error": "Drone not found"}

    drone = rows[0]

    # Mirëmbajtja e fundit
    maintenance = pg_query(
        """
        SELECT "PerformedAt", "MaintenanceType", "Status", "NextRecommendedDate"
        FROM "MaintenanceRecords"
        WHERE "DroneId" = %s AND "Status" = %s
        ORDER BY "PerformedAt" DESC
        LIMIT 10
        """,
        (drone_id, MAINTENANCE_COMPLETED),
    )

    # Bateritë e lidhura
    batteries = pg_query(
        'SELECT "HealthPercentage", "CycleCount", "Status" FROM "Batteries" WHERE "DroneId" = %s',
        (drone_id,),
    )

    # Raportet e fundit me probleme
    issues = pg_query(
        """
        SELECT r."IssuesReported", r."SubmittedAt"
        FROM "PostFlightReports" r
        JOIN "Missions" ms ON ms."Id" = r."MissionId"
        WHERE ms."DroneId" = %s
          AND r."IssuesReported" IS NOT NULL
          AND r."IssuesReported" <> ''
          AND r."SubmittedAt" > NOW() - INTERVAL '90 days'
        """,
        (drone_id,),
    )

    tele = _telemetry_stats(drone_id)

    # ===== Faktorët =====
    factors = []
    total = 0.0

    # 1. Orët e fluturimit që nga servisi i fundit
    last_service = maintenance[0]["PerformedAt"] if maintenance else None
    hours = float(drone["TotalFlightHours"] or 0)

    hours_score = _score(hours % SERVICE_INTERVAL_HOURS, 0, SERVICE_INTERVAL_HOURS)
    if hours > SERVICE_INTERVAL_HOURS and not maintenance:
        hours_score = 1.0

    total += hours_score * WEIGHTS["flight_hours"]
    factors.append({
        "name": "Orët e fluturimit",
        "value": f"{hours:.1f} h",
        "score": round(hours_score * 100),
        "weight": WEIGHTS["flight_hours"],
    })

    # 2. Koha nga servisi i fundit
    if last_service:
        days = (datetime.now(timezone.utc) - last_service.replace(tzinfo=timezone.utc)).days
    else:
        purchase = drone["PurchaseDate"]
        days = (datetime.now().date() - purchase).days if purchase else 365

    days_score = _score(days, 0, SERVICE_INTERVAL_DAYS)
    total += days_score * WEIGHTS["days_since_service"]
    factors.append({
        "name": "Ditë nga servisi i fundit",
        "value": f"{days} ditë",
        "score": round(days_score * 100),
        "weight": WEIGHTS["days_since_service"],
    })

    # 3. Shëndeti i baterive
    if batteries:
        worst = min(float(b["HealthPercentage"]) for b in batteries)
        bat_score = _score(100 - worst, 0, 45)
        value = f"{worst:.0f}%"
    else:
        bat_score, value = 0.3, "pa bateri"

    total += bat_score * WEIGHTS["battery_health"]
    factors.append({
        "name": "Shëndeti i baterisë",
        "value": value,
        "score": round(bat_score * 100),
        "weight": WEIGHTS["battery_health"],
    })

    # 4. Dridhjet
    if tele.get("vibration_p95") is not None:
        vib_score = _score(tele["vibration_p95"], 20, 70)
        vib_value = f"{tele['vibration_p95']:.0f} (p95)"
    else:
        vib_score, vib_value = 0.0, "pa të dhëna"

    total += vib_score * WEIGHTS["vibration"]
    factors.append({
        "name": "Dridhjet",
        "value": vib_value,
        "score": round(vib_score * 100),
        "weight": WEIGHTS["vibration"],
    })

    # 5. Temperatura
    if tele.get("temperature_max") is not None:
        temp_score = _score(tele["temperature_max"], 35, 60)
        temp_value = f"{tele['temperature_max']:.0f}°C max"
    else:
        temp_score, temp_value = 0.0, "pa të dhëna"

    total += temp_score * WEIGHTS["temperature"]
    factors.append({
        "name": "Temperatura",
        "value": temp_value,
        "score": round(temp_score * 100),
        "weight": WEIGHTS["temperature"],
    })

    # 6. Konsumi i baterisë krahasuar me flotën
    baseline = _fleet_drain_baseline(str(drone["DroneModelId"]))
    if tele.get("drain_rate") and baseline:
        ratio = tele["drain_rate"] / baseline
        drain_score = _score(ratio, 1.0, 1.6)
        drain_value = f"{ratio:.2f}× e mesatares"
    else:
        drain_score, drain_value = 0.0, "pa të dhëna"

    total += drain_score * WEIGHTS["battery_drain"]
    factors.append({
        "name": "Konsumi i baterisë",
        "value": drain_value,
        "score": round(drain_score * 100),
        "weight": WEIGHTS["battery_drain"],
    })

    # 7. Historia e problemeve
    issue_score = _score(len(issues), 0, 5)
    total += issue_score * WEIGHTS["issue_history"]
    factors.append({
        "name": "Probleme të raportuara",
        "value": f"{len(issues)} në 90 ditë",
        "score": round(issue_score * 100),
        "weight": WEIGHTS["issue_history"],
    })

    risk = round(min(100, total), 1)

    if risk >= 70:
        level, action = "Critical", "Ndalo dronin dhe kryej inspektim të plotë"
        days_until = 0
    elif risk >= 45:
        level, action = "High", "Planifiko servis brenda javës"
        days_until = 7
    elif risk >= 25:
        level, action = "Medium", "Përfshije në servisin e ardhshëm periodik"
        days_until = 30
    else:
        level, action = "Low", "Vazhdo monitorimin normal"
        days_until = 90

    # Komponenti më i mundshëm — faktori me peshë efektive më të lartë
    ranked = sorted(factors, key=lambda f: f["score"] * f["weight"], reverse=True)
    component_map = {
        "Dridhjet": "Motorë ose helika",
        "Shëndeti i baterisë": "Bateri",
        "Temperatura": "Sistemi i ftohjes / motorë",
        "Konsumi i baterisë": "Motorë ose bateri",
        "Orët e fluturimit": "Komponentë të konsumit",
        "Ditë nga servisi i fundit": "Inspektim i përgjithshëm",
        "Probleme të raportuara": "Sipas raporteve",
    }

    top = ranked[0]
    component = component_map.get(top["name"], "I papërcaktuar") if top["score"] > 20 else None

    return {
        "droneId": drone_id,
        "serialNumber": drone["SerialNumber"],
        "nickname": drone["Nickname"],
        "modelName": drone["ModelName"],
        "riskScore": risk,
        "riskLevel": level,
        "recommendedAction": action,
        "recommendedInspectionDays": days_until,
        "likelyComponent": component,
        "factors": factors,
        "telemetryPoints": tele.get("point_count", 0),
        "assessedAt": datetime.now(timezone.utc).isoformat(),
    }


def assess_fleet() -> list[dict]:
    """Vlerëson të gjithë dronët, të renditur sipas rrezikut."""
    drones = pg_query('SELECT "Id" FROM "Drones"')
    results = [assess_drone(str(d["Id"])) for d in drones]
    valid = [r for r in results if "error" not in r]
    return sorted(valid, key=lambda r: r["riskScore"], reverse=True)