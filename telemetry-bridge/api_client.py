"""Dërgon telemetrinë te SmartFleet API."""

import os
import requests
import urllib3
from dotenv import load_dotenv

load_dotenv()
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

API_URL = os.getenv("API_URL", "https://localhost:7017/api/v1")
VERIFY_SSL = os.getenv("VERIFY_SSL", "false").lower() == "true"


class ApiClient:
    def __init__(self):
        self.session = requests.Session()
        self.session.verify = VERIFY_SSL

    def send_telemetry(self, payload: dict) -> bool:
        try:
            r = self.session.post(
                f"{API_URL}/telemetry/ingest",
                json=payload,
                timeout=5,
            )
            if r.status_code in (200, 202):
                return True
            print(f"  API refuzoi: {r.status_code} — {r.text[:120]}")
            return False
        except requests.RequestException as e:
            print(f"  Lidhja dështoi: {e}")
            return False

    def get_drones(self, token: str) -> list:
        """Merr listën e dronëve (kërkon token)."""
        try:
            r = self.session.get(
                f"{API_URL}/drones",
                headers={"Authorization": f"Bearer {token}"},
                timeout=5,
            )
            return r.json() if r.ok else []
        except requests.RequestException:
            return []

    def login(self, email: str, password: str) -> str | None:
        try:
            r = self.session.post(
                f"{API_URL}/auth/login",
                json={"email": email, "password": password},
                timeout=5,
            )
            return r.json()["accessToken"] if r.ok else None
        except requests.RequestException:
            return None