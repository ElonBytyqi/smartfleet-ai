"""
Nis disa simulatorë njëkohësisht.

Gjen misione me dron dhe waypoints, dhe nis një simulator për secilin
në një proces të veçantë. Përdoret për demo me flotë në lëvizje.
"""

import os
import subprocess
import sys
import time

import requests
import urllib3
from dotenv import load_dotenv

load_dotenv()
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

API_URL = os.getenv("API_URL", "https://localhost:7017/api/v1")


def login(session, email, password):
    r = session.post(
        f"{API_URL}/auth/login",
        json={"email": email, "password": password},
        timeout=10,
    )
    r.raise_for_status()
    return r.json()["accessToken"]


def find_flyable_missions(session, token, limit):
    """Misione me dron, bateri dhe të paktën 2 waypoints."""
    headers = {"Authorization": f"Bearer {token}"}

    missions = session.get(f"{API_URL}/missions", headers=headers, timeout=10).json()

    usable = []
    seen_drones = set()

    for m in missions:
        if not m.get("droneId") or not m.get("batteryId"):
            continue
        if m.get("waypointCount", 0) < 2:
            continue
        # Nje dron nuk mund te fluturoje dy misione njeheresh
        if m["droneId"] in seen_drones:
            continue

        seen_drones.add(m["droneId"])
        usable.append(m)

        if len(usable) >= limit:
            break

    return usable


def main():
    email = sys.argv[1] if len(sys.argv) > 1 else "admin@smartfleet.com"
    password = sys.argv[2] if len(sys.argv) > 2 else "Admin1234!"
    count = int(sys.argv[3]) if len(sys.argv) > 3 else 4

    session = requests.Session()
    session.verify = False

    print("Duke u lidhur me API...")
    token = login(session, email, password)

    missions = find_flyable_missions(session, token, count)

    if not missions:
        print("Nuk u gjet asnjë mision me dron, bateri dhe waypoints.")
        sys.exit(1)

    print(f"\nDuke nisur {len(missions)} simulatorë:\n")

    processes = []
    for m in missions:
        print(f"  {m['droneSerialNumber']:<20} {m['title']}")

        # Cdo simulator ne dritaren e vet, qe logjet te mos perzihen
        proc = subprocess.Popen(
            [sys.executable, "simulator.py", email, password, m["id"]],
            creationflags=subprocess.CREATE_NEW_CONSOLE if os.name == "nt" else 0,
        )
        processes.append(proc)
        time.sleep(0.8)   # shmang perplasjen e login-eve

    print(f"\n{len(processes)} simulatorë duke punuar.")
    print("Ctrl+C këtu i ndal të gjithë.\n")

    try:
        for p in processes:
            p.wait()
    except KeyboardInterrupt:
        print("\nDuke ndalur...")
        for p in processes:
            p.terminate()
        print("U ndalën.")


if __name__ == "__main__":
    main()