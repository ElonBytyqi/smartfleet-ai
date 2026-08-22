"""
Analizon raportet pas fluturimit.

Piloti shkruan tekst të lirë ("dridhje te motori i pasëm i djathtë").
Ky modul e klasifikon në kategori, cakton ashpërsinë, dhe krahason
metrikat e raportuara me sjelljen e zakonshme të flotës.
"""

import re
from datetime import datetime, timezone

import numpy as np

from db import pg_query, pg_execute, telemetry

# AiAnalysisStatus ne EF Core: Pending=0, Analyzed=1, Failed=2
STATUS_PENDING = 0
STATUS_ANALYZED = 1

# Fjalë kyçe për çdo kategori problemi.
# Mbulojnë shqip dhe anglisht, sepse raportet mund të vijnë në të dyja.
CATEGORIES = {
    "Motor": {
        "label": "Motor",
        "severity": "High",
        "keywords": [
            "motor", "motorr", "motori", "motoret", "engine",
            "helik", "helika", "propeller", "prop",
            "dridhje", "vibrim", "vibration", "zhurm", "noise",
        ],
        "recommendation": "Inspekto motorët dhe helikat, kontrollo balancimin.",
    },
    "Battery": {
        "label": "Bateri",
        "severity": "High",
        "keywords": [
            "bateri", "battery", "karikim", "charge", "voltazh", "voltage",
            "shkarkim", "drain", "energji", "power",
        ],
        "recommendation": "Kontrollo shëndetin e baterisë dhe ciklet e përdorimit.",
    },
    "GPS": {
        "label": "GPS / Navigim",
        "severity": "High",
        "keywords": [
            "gps", "satelit", "satellite", "sinjal", "signal",
            "navigim", "navigation", "pozicion", "position", "devijim", "drift",
        ],
        "recommendation": "Kontrollo antenën GPS dhe interferencat në zonë.",
    },
    "Camera": {
        "label": "Kamerë / Gimbal",
        "severity": "Medium",
        "keywords": [
            "kamer", "camera", "gimbal", "foto", "photo", "video",
            "imazh", "image", "fokus", "focus", "lente", "lens",
        ],
        "recommendation": "Kalibro gimbal-in dhe kontrollo lidhjet e kamerës.",
    },
    "Communication": {
        "label": "Komunikim",
        "severity": "High",
        "keywords": [
            "lidhje", "connection", "komunikim", "telemetri", "telemetry",
            "radio", "kontroll", "control", "shkeputje", "disconnect",
        ],
        "recommendation": "Kontrollo antenat dhe distancën maksimale të lidhjes.",
    },
    "Structure": {
        "label": "Strukturë",
        "severity": "Medium",
        "keywords": [
            "krah", "arm", "trup", "frame", "kembe", "landing",
            "carje", "crack", "demtim", "damage", "thyer", "broken",
            "perplasje", "collision", "ulje e forte", "hard landing",
        ],
        "recommendation": "Inspekto strukturën dhe këmbët e uljes për dëmtime.",
    },
    "Weather": {
        "label": "Kushtet e motit",
        "severity": "Low",
        "keywords": [
            "ere", "wind", "shi", "rain", "mjegull", "fog",
            "temperature", "vape", "ftohte", "cold", "stuhi", "storm",
        ],
        "recommendation": "Rishiko kufijtë e motit për fluturime të ardhshme.",
    },
    "Sensor": {
        "label": "Sensorë",
        "severity": "Medium",
        "keywords": [
            "sensor", "imu", "kompas", "compass", "barometer",
            "kalibrim", "calibration", "lidar", "radar",
        ],
        "recommendation": "Rikalibro sensorët para fluturimit tjetër.",
    },
}

# Fjalë që rrisin ashpërsinë
INTENSIFIERS = [
    "shume", "shumë", "very", "serioz", "serious", "kritik", "critical",
    "urgjent", "urgent", "rende", "rëndë", "severe", "plotesisht", "completely",
    "deshtoi", "dështoi", "failed", "ndalur", "stopped", "humbi", "lost",
]

# Fjalë që e zbusin
DIMINISHERS = [
    "lehte", "lehtë", "slight", "minor", "pak", "little",
    "vogel", "vogël", "small", "here pas here", "occasional", "ndonjehere",
]

SEVERITY_RANK = {"Critical": 3, "High": 2, "Medium": 1, "Low": 0}
RANK_TO_SEVERITY = {v: k for k, v in SEVERITY_RANK.items()}


def _normalize(text: str) -> str:
    """Heq theksat dhe e kthen në gërma të vogla për krahasim."""
    lowered = text.lower()
    replacements = {"ë": "e", "ç": "c"}
    for a, b in replacements.items():
        lowered = lowered.replace(a, b)
    return lowered


def _classify_text(text: str) -> list[dict]:
    """Gjen kategoritë e problemeve në tekstin e raportit."""
    if not text or not text.strip():
        return []

    normalized = _normalize(text)
    found = []

    for key, category in CATEGORIES.items():
        matched = [
            kw for kw in category["keywords"]
            if _normalize(kw) in normalized
        ]

        if not matched:
            continue

        # Rregullo ashpërsinë sipas fjalëve përforcuese/zbutëse
        rank = SEVERITY_RANK[category["severity"]]

        if any(_normalize(w) in normalized for w in INTENSIFIERS):
            rank = min(3, rank + 1)
        if any(_normalize(w) in normalized for w in DIMINISHERS):
            rank = max(0, rank - 1)

        found.append({
            "category": key,
            "label": category["label"],
            "severity": RANK_TO_SEVERITY[rank],
            "matchedTerms": matched[:4],
            "recommendation": category["recommendation"],
        })

    found.sort(key=lambda f: SEVERITY_RANK[f["severity"]], reverse=True)
    return found


def _compare_with_fleet(report: dict) -> list[dict]:
    """Krahason metrikat e raportuara me mesataren e flotës."""
    observations = []

    duration = report.get("FlightDurationMinutes") or 0
    battery = report.get("BatteryUsedPercentage")

    if battery is None or duration < 3:
        return observations

    rate = float(battery) / duration

    # Mesatarja e raporteve të tjera për të njëjtin model droni
    others = pg_query(
        """
        SELECT r."FlightDurationMinutes" AS minutes,
               r."BatteryUsedPercentage" AS battery
        FROM "PostFlightReports" r
        JOIN "Missions" m ON m."Id" = r."MissionId"
        JOIN "Drones" d ON d."Id" = m."DroneId"
        WHERE d."DroneModelId" = %s
          AND r."Id" <> %s
          AND r."BatteryUsedPercentage" IS NOT NULL
          AND r."FlightDurationMinutes" >= 3
        """,
        (report["model_id"], report["Id"]),
    )

    rates = [
        float(o["battery"]) / o["minutes"]
        for o in others
        if o["minutes"] and o["minutes"] > 0
    ]

    if len(rates) >= 3:
        median = float(np.median(rates))
        if median > 0:
            ratio = rate / median
            if ratio > 1.35:
                observations.append({
                    "type": "BatteryComparison",
                    "severity": "High" if ratio > 1.6 else "Medium",
                    "text": (
                        f"Konsumi i baterisë ({rate:.2f}%/min) është "
                        f"{ratio:.1f}× mesatarja e modelit ({median:.2f}%/min)."
                    ),
                    "recommendation": "Inspekto motorët dhe gjendjen e baterisë.",
                })
            elif ratio < 0.6:
                observations.append({
                    "type": "BatteryComparison",
                    "severity": "Low",
                    "text": (
                        f"Konsumi është dukshëm nën mesataren "
                        f"({rate:.2f}%/min kundrejt {median:.2f}%/min)."
                    ),
                    "recommendation": "Verifiko saktësinë e të dhënave të raportuara.",
                })

    # Konsum absolut i lartë
    if rate > 3.5:
        observations.append({
            "type": "HighDrainRate",
            "severity": "High",
            "text": f"Konsum i lartë: {rate:.2f}% për minutë.",
            "recommendation": "Kontrollo shëndetin e baterisë dhe ngarkesën.",
        })

    return observations


def analyze_report(report_id: str) -> dict:
    """Analizon një raport dhe përditëson statusin në databazë."""

    rows = pg_query(
        """
        SELECT r."Id", r."MissionId", r."FlightDurationMinutes",
               r."BatteryUsedPercentage", r."IssuesReported",
               r."WeatherConditions", r."Summary", r."SubmittedAt",
               m."Title" AS mission_title, m."DroneId",
               d."SerialNumber", d."Nickname", d."DroneModelId" AS model_id
        FROM "PostFlightReports" r
        JOIN "Missions" m ON m."Id" = r."MissionId"
        LEFT JOIN "Drones" d ON d."Id" = m."DroneId"
        WHERE r."Id" = %s
        """,
        (report_id,),
    )

    if not rows:
        return {"error": "Report not found"}

    report = rows[0]

    # Analizo tekstin e problemeve dhe përmbledhjes
    text = " ".join(filter(None, [
        report.get("IssuesReported"),
        report.get("Summary"),
    ]))

    issues = _classify_text(text)
    observations = _compare_with_fleet(report)

    # Ashpërsia më e lartë e gjetur
    all_severities = (
        [i["severity"] for i in issues] +
        [o["severity"] for o in observations]
    )
    overall = (
        max(all_severities, key=lambda s: SEVERITY_RANK[s])
        if all_severities else "None"
    )

    # A duhet krijuar punë mirëmbajtjeje
    needs_maintenance = overall in ("Critical", "High")

    # Përmbledhje e lexueshme
    if not issues and not observations:
        summary = "Raporti nuk tregon probleme. Fluturim normal."
    else:
        parts = []
        if issues:
            labels = ", ".join(i["label"] for i in issues[:3])
            parts.append(f"Probleme të identifikuara: {labels}")
        if observations:
            parts.append(f"{len(observations)} vërejtje nga krahasimi me flotën")
        summary = ". ".join(parts) + "."

    # Përditëso statusin
    pg_execute(
        'UPDATE "PostFlightReports" SET "AiAnalysisStatus" = %s WHERE "Id" = %s',
        (STATUS_ANALYZED, report_id),
    )

    return {
        "reportId": report_id,
        "missionId": str(report["MissionId"]),
        "missionTitle": report["mission_title"],
        "droneSerialNumber": report["SerialNumber"],
        "droneNickname": report["Nickname"],
        "originalText": report.get("IssuesReported"),
        "overallSeverity": overall,
        "needsMaintenance": needs_maintenance,
        "issues": issues,
        "observations": observations,
        "summary": summary,
        "analyzedAt": datetime.now(timezone.utc).isoformat(),
    }


def analyze_pending(limit: int = 50) -> dict:
    """Analizon të gjitha raportet që presin."""
    pending = pg_query(
        """
        SELECT "Id" FROM "PostFlightReports"
        WHERE "AiAnalysisStatus" = %s
        ORDER BY "SubmittedAt" DESC
        LIMIT %s
        """,
        (STATUS_PENDING, limit),
    )

    results = []
    for row in pending:
        result = analyze_report(str(row["Id"]))
        if "error" not in result:
            results.append(result)

    with_issues = [r for r in results if r["issues"] or r["observations"]]

    return {
        "processed": len(results),
        "withFindings": len(with_issues),
        "results": results,
    }