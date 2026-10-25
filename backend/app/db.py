"""SQLite access helpers for the Cinelytics API."""
from __future__ import annotations

import sqlite3
from pathlib import Path

from fastapi import HTTPException

DB_PATH = Path(__file__).resolve().parent.parent / "cinelytics.db"


def get_db() -> sqlite3.Connection:
    if not DB_PATH.exists():
        raise HTTPException(
            status_code=503,
            detail="Database not found. Build it first: "
                   "python scripts/build_db.py (see backend/README).",
        )
    con = sqlite3.connect(DB_PATH, check_same_thread=False)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA journal_mode=WAL")
    return con
