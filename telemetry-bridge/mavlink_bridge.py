"""
Lexon MAVLink dhe e përkthen në formatin e SmartFleet API.

Funksionon me çdo burim MAVLink: PX4 SITL, ArduPilot SITL,
ose dron fizik përmes telemetrisë.
"""

import os
import time
from datetime import datetime, timezone

from dotenv import load_dotenv
from pymavlink import mavutil

from api_client import ApiClient

load_dotenv()

CONNECTION = os.getenv("MAVLINK_CONNECTION", "udpin:127.0.0.1:14550")
INTERVAL = float(os.getenv("SEND_INTERVAL", "1.0"))

# Modet e fluturimit të PX4
PX4_MODES = {
    0: "Manual", 1: "Altitude", 2: "Position", 3: "Auto",
    4: "Acro", 5: "Offboard", 6: "Stabilized", 7: "Rattitude",
}


class MavlinkBridge:
    def __init__(self, drone_id: str, mission_id: str | None = None):
        self.drone_id = drone_id
        self.mission_id = mission_id
        self.api = ApiClient()
        self.conn = None

        # Gjendja e fundit e njohur — MAVLink i dërgon fushat në mesazhe të ndara
        self.state = {
            "lat": 0.0, "lon": 0.0, "alt": 0.0,
            "vx": 0.0, "vy": 0.0, "vz": 0.0,
            "heading": 0.0,
            "battery_pct": 100.0, "battery_v": 0.0,
            "satellites": 0, "signal": 0.0,
            "temperature": None, "vibration": None,
            "mode": "Unknown", "armed": False,
        }

    def connect(self):
        print(f"Duke u lidhur me {CONNECTION} ...")
        self.conn = mavutil.mavlink_connection(CONNECTION)
        self.conn.wait_heartbeat()
        print(f"Lidhja u vendos (system {self.conn.target_system})")

    def update_from_message(self, msg):
        """Përditëson gjendjen sipas tipit të mesazhit."""
        t = msg.get_type()

        if t == "GLOBAL_POSITION_INT":
            self.state["lat"] = msg.lat / 1e7
            self.state["lon"] = msg.lon / 1e7
            self.state["alt"] = msg.relative_alt / 1000.0
            self.state["vx"] = msg.vx / 100.0
            self.state["vy"] = msg.vy / 100.0
            self.state["vz"] = -msg.vz / 100.0   # MAVLink: poshtë = pozitiv
            self.state["heading"] = msg.hdg / 100.0 if msg.hdg != 65535 else 0.0

        elif t == "SYS_STATUS":
            if msg.battery_remaining >= 0:
                self.state["battery_pct"] = float(msg.battery_remaining)
            self.state["battery_v"] = msg.voltage_battery / 1000.0

        elif t == "GPS_RAW_INT":
            self.state["satellites"] = msg.satellites_visible
            # fix_type: 3 = 3D fix
            self.state["signal"] = min(100.0, msg.satellites_visible * 7.0)

        elif t == "VIBRATION":
            # Mesatarja e tri akseve, e shkallëzuar në 0-100
            avg = (msg.vibration_x + msg.vibration_y + msg.vibration_z) / 3
            self.state["vibration"] = min(100.0, avg * 2)

        elif t == "SCALED_PRESSURE":
            self.state["temperature"] = msg.temperature / 100.0

        elif t == "HEARTBEAT":
            self.state["armed"] = bool(
                msg.base_mode & mavutil.mavlink.MAV_MODE_FLAG_SAFETY_ARMED
            )
            self.state["mode"] = PX4_MODES.get(msg.custom_mode >> 16, "Unknown")

    def build_payload(self) -> dict:
        s = self.state
        ground_speed = (s["vx"] ** 2 + s["vy"] ** 2) ** 0.5

        return {
            "droneId": self.drone_id,
            "missionId": self.mission_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "latitude": s["lat"],
            "longitude": s["lon"],
            "altitudeMeters": s["alt"],
            "groundSpeedMs": round(ground_speed, 2),
            "verticalSpeedMs": round(s["vz"], 2),
            "headingDegrees": round(s["heading"], 1),
            "batteryPercentage": round(s["battery_pct"], 1),
            "batteryVoltage": round(s["battery_v"], 2),
            "satelliteCount": s["satellites"],
            "signalStrength": round(s["signal"], 1),
            "temperatureCelsius": s["temperature"],
            "vibrationLevel": s["vibration"],
            "flightMode": s["mode"],
            "isArmed": s["armed"],
        }

    def run(self):
        self.connect()
        last_sent = 0.0
        sent = 0

        print(f"Duke transmetuar çdo {INTERVAL}s. Ctrl+C për të ndalur.\n")

        while True:
            msg = self.conn.recv_match(blocking=True, timeout=1)
            if msg:
                self.update_from_message(msg)

            now = time.time()
            if now - last_sent >= INTERVAL:
                # Mos dërgo derisa të kemi pozicion të vlefshëm
                if self.state["lat"] != 0.0 or self.state["lon"] != 0.0:
                    payload = self.build_payload()
                    if self.api.send_telemetry(payload):
                        sent += 1
                        print(
                            f"[{sent:4d}] "
                            f"{payload['latitude']:.5f}, {payload['longitude']:.5f} · "
                            f"{payload['altitudeMeters']:.0f}m · "
                            f"{payload['groundSpeedMs']:.1f}m/s · "
                            f"bateria {payload['batteryPercentage']:.0f}% · "
                            f"{payload['flightMode']}"
                        )
                last_sent = now


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Përdorimi: python mavlink_bridge.py <droneId> [missionId]")
        sys.exit(1)

    bridge = MavlinkBridge(
        drone_id=sys.argv[1],
        mission_id=sys.argv[2] if len(sys.argv) > 2 else None,
    )

    try:
        bridge.run()
    except KeyboardInterrupt:
        print("\nU ndal.")