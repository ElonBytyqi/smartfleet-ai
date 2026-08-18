"""
Zbulon fluturime jonormale duke kombinuar dy qasje:

  1. Rregulla të drejtpërdrejta — gjëra që i dimë me siguri se janë problem
     (bateri kritike, humbje GPS, devijim nga rruga, lartësi mbi kufi)

  2. Isolation Forest — gjen pika që dallojnë statistikisht nga sjellja
     normale e së njëjtës flotë, edhe kur asnjë rregull s'shkelet
"""

import math
from datetime import datetime, timedelta, timezone

import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

from db import pg_query, telemetry

# Pragjet e rregullave
BATTERY_CRITICAL = 15
BATTERY_LOW = 25
MIN_SATELLITES = 6
MAX_ALTITUDE = 500
HIGH_VIBRATION = 55
HIGH_TEMPERATURE = 55
MAX_ROUTE_DEVIATION_M = 120
MIN_FLIGHT_SECONDS = 300

# Nese mes dy pikave kalon me shume se kaq, jane fluturime te ndryshme
FLIGHT_GAP_SECONDS = 15

SEVERITY_ORDER = {"Critical": 3, "High": 2, "Medium": 1, "Low": 0}


def _haversine(lat1, lon1, lat2, lon2) -> float:
    """Distanca në metra."""
    r = 6371000
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def _distance_to_segment(p, a, b) -> float:
    """Distanca më e shkurtër nga pika p te segmenti a-b."""
    ax, ay = a
    bx, by = b
    px, py = p

    dx, dy = bx - ax, by - ay
    if dx == 0 and dy == 0:
        return _haversine(py, px, ay, ax)

    t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    cx, cy = ax + t * dx, ay + t * dy
    return _haversine(py, px, cy, cx)


def _split_flights(points: list[dict]) -> list[list[dict]]:
    """
    Ndan telemetrinë në fluturime të veçanta.

    Nëse simulatori ose droni ndalon dhe rinis, mes pikave mbetet një hendek.
    Pa këtë ndarje, ndërprerja duket si ulje e menjëhershme dhe kohëzgjatja
    llogaritet gabim.
    """
    if not points:
        return []

    flights = [[points[0]]]

    for prev, curr in zip(points, points[1:]):
        gap = (curr["Timestamp"] - prev["Timestamp"]).total_seconds()
        if gap > FLIGHT_GAP_SECONDS:
            flights.append([curr])
        else:
            flights[-1].append(curr)

    return [f for f in flights if len(f) >= 10]


def _route_deviation(points: list[dict], waypoints: list[dict]) -> list[float]:
    """Sa larg rrugës së planifikuar ishte droni në çdo pikë."""
    if len(waypoints) < 2:
        return []

    segments = [
        ((waypoints[i]["lon"], waypoints[i]["lat"]),
         (waypoints[i + 1]["lon"], waypoints[i + 1]["lat"]))
        for i in range(len(waypoints) - 1)
    ]

    deviations = []
    for p in points:
        pt = (p["Longitude"], p["Latitude"])
        deviations.append(min(_distance_to_segment(pt, a, b) for a, b in segments))

    return deviations


def _rule_based(points: list[dict], deviations: list[float]) -> list[dict]:
    """Anomalitë që i kapim me rregulla të qarta."""
    findings = []

    # --- Bateria ---
    batteries = [p["BatteryPercentage"] for p in points]
    min_battery = min(batteries)

    if min_battery <= BATTERY_CRITICAL:
        findings.append({
            "type": "BatteryCritical",
            "severity": "Critical",
            "title": "Bateri kritike gjatë fluturimit",
            "detail": f"Niveli ra në {min_battery:.0f}%, nën pragun e sigurisë prej {BATTERY_CRITICAL}%.",
            "recommendation": "Kontrollo planifikimin e misionit dhe gjendjen e baterisë.",
        })
    elif min_battery <= BATTERY_LOW:
        findings.append({
            "type": "BatteryLow",
            "severity": "Medium",
            "title": "Bateri e ulët",
            "detail": f"Niveli ra në {min_battery:.0f}%.",
            "recommendation": "Rrit rezervën e baterisë për misione të ngjashme.",
        })

    # --- Konsumi për minutë ---
    duration_s = (points[-1]["Timestamp"] - points[0]["Timestamp"]).total_seconds()
    used = batteries[0] - batteries[-1]

    if duration_s > MIN_FLIGHT_SECONDS and used > 0:
        rate = used / (duration_s / 60)
        if rate > 3.5:
            findings.append({
                "type": "HighBatteryDrain",
                "severity": "High",
                "title": "Konsum jonormal i baterisë",
                "detail": f"{rate:.2f}% për minutë ({used:.0f}% në {duration_s/60:.0f} min).",
                "recommendation": "Inspekto motorët, helikat dhe shëndetin e baterisë.",
            })

    # --- GPS ---
    weak_gps = [p for p in points if p.get("SatelliteCount", 0) < MIN_SATELLITES]
    if len(weak_gps) > len(points) * 0.05:
        pct = len(weak_gps) / len(points) * 100
        findings.append({
            "type": "GpsSignalLoss",
            "severity": "High" if pct > 20 else "Medium",
            "title": "Sinjal GPS i dobët",
            "detail": f"{pct:.0f}% e fluturimit me më pak se {MIN_SATELLITES} satelitë.",
            "recommendation": "Kontrollo antenën GPS dhe interferencat në zonë.",
        })

    # --- Lartësia ---
    altitudes = [p["AltitudeMeters"] for p in points]
    max_alt = max(altitudes)
    if max_alt > MAX_ALTITUDE:
        findings.append({
            "type": "AltitudeExceeded",
            "severity": "Critical",
            "title": "Lartësi mbi kufirin e lejuar",
            "detail": f"Arriti {max_alt:.0f} m, kufiri është {MAX_ALTITUDE} m.",
            "recommendation": "Rishiko parametrat e misionit dhe kufizimet e zonës.",
        })

    # --- Ulje e papritur ---
    for i in range(1, len(points)):
        dt = (points[i]["Timestamp"] - points[i - 1]["Timestamp"]).total_seconds()
        if dt <= 0 or dt > 5:
            continue
        drop = altitudes[i - 1] - altitudes[i]
        if drop / dt > 8:
            findings.append({
                "type": "RapidDescent",
                "severity": "High",
                "title": "Ulje e shpejtë",
                "detail": f"Humbje {drop:.0f} m për {dt:.0f} s.",
                "recommendation": "Kontrollo motorët dhe kushtet e erës gjatë fluturimit.",
            })
            break

    # --- Dridhjet ---
    vibrations = [p["VibrationLevel"] for p in points if p.get("VibrationLevel") is not None]
    if vibrations:
        p95 = float(np.percentile(vibrations, 95))
        if p95 > HIGH_VIBRATION:
            findings.append({
                "type": "HighVibration",
                "severity": "High",
                "title": "Dridhje të larta",
                "detail": f"Niveli p95 arriti {p95:.0f}.",
                "recommendation": "Inspekto helikat, motorët dhe balancimin.",
            })

    # --- Temperatura ---
    temps = [p["TemperatureCelsius"] for p in points if p.get("TemperatureCelsius") is not None]
    if temps and max(temps) > HIGH_TEMPERATURE:
        findings.append({
            "type": "HighTemperature",
            "severity": "Medium",
            "title": "Temperaturë e lartë",
            "detail": f"Arriti {max(temps):.0f}°C.",
            "recommendation": "Kontrollo ftohjen dhe shmang fluturimet në vapë.",
        })

    # --- Devijimi nga rruga ---
    if deviations:
        max_dev = max(deviations)
        if max_dev > MAX_ROUTE_DEVIATION_M:
            findings.append({
                "type": "RouteDeviation",
                "severity": "High" if max_dev > 250 else "Medium",
                "title": "Devijim nga rruga e planifikuar",
                "detail": f"Deri në {max_dev:.0f} m larg rrugës.",
                "recommendation": "Kontrollo GPS-in, erën dhe konfigurimin e navigimit.",
            })

    return findings


def _statistical(points: list[dict]) -> list[dict]:
    """
    Isolation Forest mbi telemetrinë e fluturimit.
    Gjen pika që dallojnë nga sjellja e zakonshme.
    """
    if len(points) < 60:
        return []

    features = []
    for p in points:
        features.append([
            p.get("GroundSpeedMs", 0),
            p.get("VerticalSpeedMs", 0),
            p.get("AltitudeMeters", 0),
            p.get("BatteryPercentage", 100),
            p.get("SatelliteCount", 0),
            p.get("VibrationLevel") or 0,
        ])

    X = np.array(features, dtype=float)

    if np.all(np.std(X, axis=0) < 1e-9):
        return []

    X_scaled = StandardScaler().fit_transform(X)

    model = IsolationForest(
        contamination=0.03,
        random_state=42,
        n_estimators=120,
    )
    labels = model.fit_predict(X_scaled)
    scores = model.decision_function(X_scaled)

    outlier_idx = np.where(labels == -1)[0]
    if len(outlier_idx) == 0:
        return []

    worst = int(outlier_idx[np.argmin(scores[outlier_idx])])
    worst_point = points[worst]
    pct = len(outlier_idx) / len(points) * 100

    severity = "High" if pct > 8 else "Medium" if pct > 4 else "Low"

    return [{
        "type": "StatisticalAnomaly",
        "severity": severity,
        "title": "Sjellje statistikisht e pazakontë",
        "detail": (
            f"{len(outlier_idx)} nga {len(points)} pika ({pct:.1f}%) dallojnë nga "
            f"modeli i fluturimit. Më e theksuara në "
            f"{worst_point['Timestamp'].strftime('%H:%M:%S')}Z: "
            f"{worst_point.get('GroundSpeedMs', 0):.1f} m/s, "
            f"{worst_point.get('AltitudeMeters', 0):.0f} m, "
            f"bateria {worst_point.get('BatteryPercentage', 0):.0f}%."
        ),
        "recommendation": "Shqyrto telemetrinë rreth kësaj kohe për shkakun.",
    }]


def analyze_mission(mission_id: str) -> dict:
    """Analizon një mision, duke trajtuar veçmas çdo fluturim."""

    missions = pg_query(
        """
        SELECT m."Id", m."Title", m."MissionType", m."Status",
               m."ScheduledStart", m."ActualStart", m."ActualEnd",
               m."DroneId", m."IsAutonomous",
               d."SerialNumber", d."Nickname",
               z."Name" AS zone_name, z."MaxAltitudeMeters"
        FROM "Missions" m
        LEFT JOIN "Drones" d ON d."Id" = m."DroneId"
        LEFT JOIN "FlightZones" z ON z."Id" = m."FlightZoneId"
        WHERE m."Id" = %s
        """,
        (mission_id,),
    )

    if not missions:
        return {"error": "Mission not found"}

    mission = missions[0]

    all_points = list(telemetry.find({"MissionId": mission_id}).sort("Timestamp", 1))
    flights = _split_flights(all_points)

    base = {
        "missionId": mission_id,
        "missionTitle": mission["Title"],
        "droneId": str(mission["DroneId"]) if mission["DroneId"] else None,
        "droneSerialNumber": mission["SerialNumber"],
        "droneNickname": mission["Nickname"],
        "zoneName": mission["zone_name"],
        "telemetryPoints": len(all_points),
        "analyzedAt": datetime.now(timezone.utc).isoformat(),
    }

    if not flights:
        return {
            **base,
            "flightCount": 0,
            "durationMinutes": None,
            "batteryUsed": None,
            "maxDeviationMeters": None,
            "healthScore": None,
            "anomalies": [],
            "summary": "Të dhëna të pamjaftueshme telemetrie për analizë.",
        }

    wp_rows = pg_query(
        """
        SELECT "Latitude" AS lat, "Longitude" AS lon, "SequenceNumber"
        FROM "MissionWaypoints"
        WHERE "MissionId" = %s
        ORDER BY "SequenceNumber"
        """,
        (mission_id,),
    )
    waypoints = [{"lat": float(w["lat"]), "lon": float(w["lon"])} for w in wp_rows]

    all_anomalies: list[dict] = []
    total_duration = 0.0
    total_battery = 0.0
    max_deviation = 0.0

    for index, flight in enumerate(flights, start=1):
        deviations = _route_deviation(flight, waypoints)

        found = _rule_based(flight, deviations) + _statistical(flight)

        if len(flights) > 1:
            for f in found:
                f["flightIndex"] = index
                f["flightTime"] = flight[0]["Timestamp"].strftime("%d.%m %H:%M") + "Z"

        all_anomalies.extend(found)

        duration = (flight[-1]["Timestamp"] - flight[0]["Timestamp"]).total_seconds() / 60
        used = flight[0]["BatteryPercentage"] - flight[-1]["BatteryPercentage"]

        total_duration += duration
        total_battery += max(0.0, used)

        if deviations:
            max_deviation = max(max_deviation, max(deviations))

    # Hiq dublikatat e të njëjtit tip
    unique: dict[str, dict] = {}
    for a in all_anomalies:
        existing = unique.get(a["type"])
        if not existing:
            unique[a["type"]] = a
        elif SEVERITY_ORDER[a["severity"]] > SEVERITY_ORDER[existing["severity"]]:
            a["occurrences"] = existing.get("occurrences", 1) + 1
            unique[a["type"]] = a
        else:
            existing["occurrences"] = existing.get("occurrences", 1) + 1

    anomalies = sorted(
        unique.values(),
        key=lambda a: SEVERITY_ORDER[a["severity"]],
        reverse=True,
    )

    penalties = {"Critical": 35, "High": 20, "Medium": 10, "Low": 4}
    health = max(0, 100 - sum(penalties[a["severity"]] for a in anomalies))

    if not anomalies:
        summary = f"{len(flights)} fluturim(e) normale, pa anomali."
    else:
        worst = anomalies[0]["severity"].lower()
        summary = (
            f"{len(anomalies)} anomali në {len(flights)} fluturim(e), "
            f"më e rënda: {worst}."
        )

    return {
        **base,
        "flightCount": len(flights),
        "durationMinutes": round(total_duration, 1),
        "batteryUsed": round(total_battery, 1),
        "maxDeviationMeters": round(max_deviation, 1) if max_deviation else None,
        "healthScore": health,
        "anomalies": anomalies,
        "summary": summary,
    }


def recent_anomalies(days: int = 14, limit: int = 50) -> list[dict]:
    """Analizon misionet e fundit që kanë telemetri."""
    since = datetime.now(timezone.utc) - timedelta(days=days)

    mission_ids = telemetry.distinct(
        "MissionId", {"Timestamp": {"$gte": since}, "MissionId": {"$ne": None}}
    )

    results = []
    for mid in mission_ids[:limit]:
        result = analyze_mission(str(mid))
        if "error" not in result and result["anomalies"]:
            results.append(result)

    results.sort(key=lambda r: r["healthScore"] or 100)
    return results