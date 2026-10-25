"""Optional TMDB artwork enrichment.

IMDb's datasets contain no images, so by default every non-featured movie is
rendered with a generated typographic poster. If a TMDB API key is configured
(free at https://www.themoviedb.org/settings/api), this module lazily resolves
real posters/backdrops by IMDb id, caches them in the `artwork` table and
injects them into API responses. Without a key everything degrades gracefully
to the generated posters.

Set the key via backend/.env (`TMDB_API_KEY=...`) or the environment.
"""
from __future__ import annotations

import json
import os
import sqlite3
import threading
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from .db import DB_PATH

BACKEND_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BACKEND_DIR / ".env"

# --------------------------------------------------------------------------- #
# tiny .env loader (no extra dependency)
# --------------------------------------------------------------------------- #
def _load_env() -> None:
    if not ENV_FILE.is_file():
        return
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


_load_env()
TMDB_API_KEY = os.environ.get("TMDB_API_KEY", "").strip()
ENABLED = bool(TMDB_API_KEY)

_IMG_BASE = "https://image.tmdb.org/t/p"
_LOCK = threading.Lock()
_DISABLED = not ENABLED  # flipped off permanently on auth errors (bad key)

_session_lock = threading.Lock()


def _db() -> sqlite3.Connection:
    con = sqlite3.connect(DB_PATH, timeout=10, check_same_thread=False)
    con.row_factory = sqlite3.Row
    return con


def _ensure_table(con: sqlite3.Connection) -> None:
    con.execute(
        """CREATE TABLE IF NOT EXISTS artwork (
               tconst   TEXT PRIMARY KEY,
               poster   TEXT,
               backdrop TEXT,
               miss     INTEGER DEFAULT 0
           )"""
    )
    con.commit()


def lookup(tconst: str) -> tuple[str | None, str | None]:
    """Query TMDB's /find endpoint for one IMDb id -> (poster_url, backdrop_url)."""
    global _DISABLED
    if _DISABLED or not tconst.startswith("tt"):
        return None, None
    url = (
        f"https://api.themoviedb.org/3/find/{tconst}"
        f"?api_key={TMDB_API_KEY}&external_source=imdb_id&language=en-US"
    )
    req = urllib.request.Request(url, headers={"User-Agent": "Cinelytics/2.0", "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=2.5) as res:
            payload = json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        if e.code in (401, 403):  # invalid key — stop hammering, keep app functional
            _DISABLED = True
        return None, None
    except Exception:
        return None, None

    movies = payload.get("movie_results") or []
    if not movies:
        return None, None
    m = movies[0]
    poster = f"{_IMG_BASE}/w500{m['poster_path']}" if m.get("poster_path") else None
    backdrop = f"{_IMG_BASE}/w1280{m['backdrop_path']}" if m.get("backdrop_path") else None
    return poster, backdrop


def enrich_movies(items: list[dict], allow_fetch: bool = True) -> list[dict]:
    """Fill poster/backdrop on movie dicts.

    allow_fetch=False is used by browse/list endpoints: cache-only, zero network
    latency — real posters appear there once the bulk warmer has run. Detail
    pages use allow_fetch=True so individual movies self-heal (bounded: one
    batch of ≤ a dozen lookups, results cached forever).
    """
    global _DISABLED
    if _DISABLED or not items:
        return items

    wanted = [it["tconst"] for it in items if not it.get("poster")]
    if not wanted:
        return items

    try:
        con = _db()
        _ensure_table(con)
        placeholders = ",".join("?" * len(wanted))
        rows = con.execute(
            f"SELECT tconst, poster, backdrop, miss FROM artwork WHERE tconst IN ({placeholders})",
            wanted,
        ).fetchall()
    except Exception:
        return items

    cached = {r["tconst"]: r for r in rows}
    to_fetch = [t for t in wanted if t not in cached] if allow_fetch else []

    if to_fetch:
        with ThreadPoolExecutor(max_workers=12) as pool:
            results = dict(zip(to_fetch, pool.map(lookup, to_fetch)))
        with _LOCK:
            try:
                con.executemany(
                    "INSERT OR REPLACE INTO artwork VALUES (?,?,?,?)",
                    [
                        (t, p or None, b or None, 0 if (p or b) else 1)
                        for t, (p, b) in results.items()
                    ],
                )
                con.commit()
            except Exception:
                pass
        cached.update(
            {t: {"tconst": t, "poster": p, "backdrop": b, "miss": 0 if (p or b) else 1}
             for t, (p, b) in results.items()}
        )

    for it in items:
        r = cached.get(it["tconst"])
        if r and not it.get("poster"):
            if r["poster"]:
                it["poster"] = r["poster"]
            if r["backdrop"] and not it.get("backdrop"):
                it["backdrop"] = r["backdrop"]
    return items
