"""Cinelytics API — FastAPI application entry point."""
from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from .db import DB_PATH
from .routers import analytics, movies

FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not DB_PATH.exists():
        print("=" * 64)
        print(f"WARNING: database not found at {DB_PATH}")
        print("Run:  python scripts/build_db.py   (from the backend/ folder)")
        print("=" * 64)
    yield


app = FastAPI(
    title="Cinelytics API",
    version="2.0.0",
    description=(
        "Movie insights platform built on the official IMDb datasets. "
        "Full-text search, faceted filtering, analytics aggregations and "
        "content-based recommendations."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(movies.router)
app.include_router(analytics.router)


@app.get("/api/health")
def health():
    from . import tmdb

    movies = None
    if DB_PATH.exists():
        import sqlite3

        con = sqlite3.connect(DB_PATH)
        movies = con.execute("SELECT COUNT(*) FROM movies").fetchone()[0]
        con.close()
    return {
        "status": "ok",
        "database": DB_PATH.exists(),
        "movies": movies,
        "tmdb_artwork": tmdb.ENABLED and not tmdb._DISABLED,
    }


# ---- production mode: serve the built frontend (frontend/dist) ----
if FRONTEND_DIST.is_dir():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/{path:path}")
    def spa(path: str):
        file = FRONTEND_DIST / path
        if path and file.is_file():
            return FileResponse(file)
        return FileResponse(FRONTEND_DIST / "index.html")
