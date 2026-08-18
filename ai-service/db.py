"""Lidhjet me PostgreSQL dhe MongoDB."""

import os
import psycopg2
import psycopg2.extras
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

POSTGRES_URL = os.getenv("POSTGRES_URL")
MONGO_URL = os.getenv("MONGO_URL")
MONGO_DB = os.getenv("MONGO_DB", "smartfleet_telemetry")

_mongo_client = MongoClient(MONGO_URL)
telemetry = _mongo_client[MONGO_DB]["telemetry"]


def pg_query(sql: str, params: tuple = ()) -> list[dict]:
    """Ekzekuton nje query dhe kthen rreshtat si dictionary."""
    with psycopg2.connect(POSTGRES_URL) as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(sql, params)
            return [dict(row) for row in cur.fetchall()]


def pg_execute(sql: str, params: tuple = ()) -> None:
    with psycopg2.connect(POSTGRES_URL) as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
        conn.commit()