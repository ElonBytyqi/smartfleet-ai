"""
Simulator i përkohshëm — fluturon përgjatë waypoints të një misioni
dhe dërgon telemetri realiste te API.

Zëvendësohet nga PX4 SITL kur të jetë gati.
"""

import math
import os
import random
import sys
import time
from datetime import datetime, timezone

from dotenv import load_dotenv
from api_client import ApiClient

load_dotenv()

INTERVAL = float(os.getenv("SEND_INTERVAL", "1.0"))
CRUISE_SPEED = 12.0   # m/s


def haversine(lat1, lon1, lat2, lon2) -> float:
    """Distanca në metra mes dy pikave."""
    r = 6371000
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def bearing(lat1, lon1, lat2, lon2) -> float:
    """Drejtimi në gradë."""
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dl = math.radians(lon2 - lon1)
    y = math.sin(dl) * math.cos(p2)
    x = math.cos(p1) * math.sin(p2) - math.sin(p1) * math.cos(p2) * math.cos(dl)
    return (math.degrees(math.atan2(y, x)) + 360) % 360


class FlightSimulator:
    def __init__(self, drone_id, mission_id, waypoints):
        self.drone_id = drone_id
        self.mission_id = mission_id
        self.waypoints = waypoints
        self.api = ApiClient()

        self.leg = 0            # segmenti aktual
        self.progress = 0.0     # 0-1 brenda segmentit
        self.battery = 98.0
        self.sent = 0

    def current_position(self):
        a = self.waypoints[self.leg]
        b = self.waypoints[self.leg + 1]

        lat = a["lat"] + (b["lat"] - a["lat"]) * self.progress
        lon = a["lon"] + (b["lon"] - a["lon"]) * self.progress
        alt = a["alt"] + (b["alt"] - a["alt"]) * self.progress

        return lat, lon, alt, bearing(a["lat"], a["lon"], b["lat"], b["lon"])

    def advance(self):
        a = self.waypoints[self.leg]
        b = self.waypoints[self.leg + 1]
        leg_length = max(haversine(a["lat"], a["lon"], b["lat"], b["lon"]), 1)

        self.progress += (CRUISE_SPEED * INTERVAL) / leg_length

        while self.progress >= 1.0:
            self.progress -= 1.0
            self.leg += 1
            if self.leg >= len(self.waypoints) - 1:
                return False   # rruga mbaroi

        # Bateria bie ~0.06% për sekondë, me luhatje të vogël
        self.battery = max(0.0, self.battery - 0.06 * INTERVAL * random.uniform(0.8, 1.2))
        return True

    def run(self):
        print(f"Simulim i fluturimit me {len(self.waypoints)} pika.")
        print(f"Ctrl+C për të ndalur.\n")

        while True:
            lat, lon, alt, hdg = self.current_position()

            payload = {
                "droneId": self.drone_id,
                "missionId": self.mission_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "latitude": round(lat + random.uniform(-2e-6, 2e-6), 7),
                "longitude": round(lon + random.uniform(-2e-6, 2e-6), 7),
                "altitudeMeters": round(alt + random.uniform(-0.6, 0.6), 1),
                "groundSpeedMs": round(CRUISE_SPEED + random.uniform(-1.2, 1.2), 2),
                "verticalSpeedMs": round(random.uniform(-0.4, 0.4), 2),
                "headingDegrees": round(hdg, 1),
                "batteryPercentage": round(self.battery, 1),
                "batteryVoltage": round(19.6 + (self.battery / 100) * 5.6, 2),
                "satelliteCount": random.randint(11, 18),
                "signalStrength": round(random.uniform(82, 99), 1),
                "temperatureCelsius": round(random.uniform(19, 31), 1),
                "vibrationLevel": round(random.uniform(4, 22), 1),
                "flightMode": "Auto",
                "isArmed": True,
            }

            if self.api.send_telemetry(payload):
                self.sent += 1
                print(
                    f"[{self.sent:4d}] pika {self.leg + 1}/{len(self.waypoints) - 1} · "
                    f"{payload['latitude']:.5f}, {payload['longitude']:.5f} · "
                    f"{payload['altitudeMeters']:.0f}m · "
                    f"bateria {payload['batteryPercentage']:.0f}%"
                )

            if not self.advance():
                print("\nRruga u kompletua.")
                break

            if self.battery <= 5:
                print("\nBateria u shterua.")
                break

            time.sleep(INTERVAL)


def main():
    if len(sys.argv) < 4:
        print("Përdorimi: python simulator.py <email> <password> <missionId>")
        sys.exit(1)

    email, password, mission_id = sys.argv[1], sys.argv[2], sys.argv[3]

    api = ApiClient()
    token = api.login(email, password)
    if not token:
        print("Login dështoi.")
        sys.exit(1)

    headers = {"Authorization": f"Bearer {token}"}

    mission = api.session.get(
        f"{os.getenv('API_URL')}/missions/{mission_id}", headers=headers, timeout=5
    ).json()

    if not mission.get("droneId"):
        print("Misioni s'ka dron të caktuar.")
        sys.exit(1)

    wp_raw = api.session.get(
        f"{os.getenv('API_URL')}/missions/{mission_id}/waypoints",
        headers=headers, timeout=5
    ).json()

    if len(wp_raw) < 2:
        print("Misioni ka më pak se dy waypoints.")
        sys.exit(1)

    waypoints = [
        {
            "lat": float(w["latitude"]),
            "lon": float(w["longitude"]),
            "alt": float(w["altitudeMeters"] or 100),
        }
        for w in sorted(wp_raw, key=lambda x: x["sequenceNumber"])
    ]

    print(f"Misioni: {mission['title']}")
    print(f"Droni:   {mission['droneSerialNumber']}\n")

    FlightSimulator(mission["droneId"], mission_id, waypoints).run()


if __name__ == "__main__":
    main()