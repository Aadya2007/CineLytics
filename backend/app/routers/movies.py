"""Movie endpoints: browse, full-text search, detail, similar, collections."""
from __future__ import annotations

import math
from functools import lru_cache

from fastapi import APIRouter, HTTPException, Query

from .. import tmdb
from ..db import get_db
from .common import fts_query, genre_names, row_to_detail, row_to_movie

router = APIRouter(prefix="/api")

SORTS = {
    "rating": "((m.votes * 1.0 / (m.votes + {m})) * m.rating + ({m} * 1.0 / (m.votes + {m})) * "
              "(SELECT AVG(rating) FROM movies)) {dir}, m.votes DESC",
    "votes": "m.votes {dir}, m.rating DESC",
    "year": "m.year {dir}, m.votes DESC",
    "title": "m.title COLLATE NOCASE {dir}",
}

# Bayesian prior weight (like IMDb's own WR formula): a movie needs roughly
# this many votes before its raw rating can outrank the global mean.
BAYES_M = 1500


@router.get("/movies")
def list_movies(
    search: str = Query("", max_length=100),
    genre: str = Query("", description="comma-separated genres, OR-matched"),
    year_from: int | None = Query(None, ge=1900, le=2100),
    year_to: int | None = Query(None, ge=1900, le=2100),
    min_rating: float | None = Query(None, ge=0, le=10),
    min_votes: int | None = Query(None, ge=0),
    max_runtime: int | None = Query(None, ge=1, le=600),
    sort: str = Query("votes", pattern="^(rating|votes|year|title)$"),
    order: str = Query("desc", pattern="^(asc|desc)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(24, ge=1, le=96),
):
    con = get_db()
    where, params = ["1=1"], []

    if search.strip():
        fq = fts_query(search)
        where.append(
            "m.rowid IN (SELECT rowid FROM movies_fts WHERE movies_fts MATCH ?)"
        )
        params.append(fq)

    if genre:
        parts = [g.strip() for g in genre.split(",") if g.strip()]
        if parts:
            where.append("(" + " OR ".join(["genres LIKE ?"] * len(parts)) + ")")
            params += [f"%,{p},%" for p in parts]

    if year_from is not None:
        where.append("m.year >= ?")
        params.append(year_from)
    if year_to is not None:
        where.append("m.year <= ?")
        params.append(year_to)
    if min_rating is not None:
        where.append("m.rating >= ?")
        params.append(min_rating)
    if min_votes is not None:
        where.append("m.votes >= ?")
        params.append(min_votes)
    if max_runtime is not None:
        where.append("m.runtime <= ?")
        params.append(max_runtime)

    where_sql = " AND ".join(where)
    total = con.execute(
        f"SELECT COUNT(*) FROM movies m WHERE {where_sql}", params
    ).fetchone()[0]

    order_sql = SORTS[sort].format(dir="ASC" if order == "asc" else "DESC", m=BAYES_M)
    rows = con.execute(
        f"SELECT * FROM movies m WHERE {where_sql} ORDER BY {order_sql} "
        f"LIMIT ? OFFSET ?",
        params + [page_size, (page - 1) * page_size],
    ).fetchall()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": max(1, math.ceil(total / page_size)),
        "items": tmdb.enrich_movies([row_to_movie(r) for r in rows], allow_fetch=False),
    }


@router.get("/movies/featured")
def featured():
    con = get_db()
    rows = con.execute(
        "SELECT * FROM movies WHERE featured = 1 ORDER BY votes DESC"
    ).fetchall()
    return [row_to_movie(r) for r in rows]


COLLECTIONS: dict[str, dict] = {
    "top-rated": {
        "label": "Highest Rated of All Time",
        "sql": "SELECT * FROM movies WHERE votes >= 250000 "
               "ORDER BY rating DESC, votes DESC LIMIT 24",
    },
    "trending": {
        "label": "Most Voted Recent Releases",
        "sql": "SELECT * FROM movies WHERE year >= 2019 "
               "ORDER BY votes DESC LIMIT 24",
    },
    "hidden-gems": {
        "label": "Hidden Gems — Brilliant & Underrated",
        "sql": "SELECT * FROM movies WHERE rating >= 7.9 AND votes BETWEEN 3000 AND 40000 "
               "ORDER BY rating DESC LIMIT 24",
    },
    "classics": {
        "label": "Timeless Classics",
        "sql": "SELECT * FROM movies WHERE year < 1980 AND votes >= 50000 "
               "ORDER BY votes DESC LIMIT 24",
    },
}


@router.get("/collections")
def list_collections():
    return [{"slug": k, "label": v["label"]} for k, v in COLLECTIONS.items()]


@router.get("/collections/{slug}")
def collection(slug: str):
    if slug not in COLLECTIONS:
        raise HTTPException(404, f"Unknown collection '{slug}'")
    con = get_db()
    rows = con.execute(COLLECTIONS[slug]["sql"]).fetchall()
    return {"slug": slug, "label": COLLECTIONS[slug]["label"],
            "items": tmdb.enrich_movies([row_to_movie(r) for r in rows], allow_fetch=False)}


@router.get("/genres")
def genres():
    stats = genre_names()
    return [g["genre"] for g in stats]


@router.get("/movies/{tconst}")
def movie_detail(tconst: str):
    con = get_db()
    r = con.execute("SELECT * FROM movies WHERE tconst = ?", (tconst,)).fetchone()
    if r is None:
        raise HTTPException(404, "Movie not found")
    return tmdb.enrich_movies([row_to_detail(r)])[0]


# --------------------------------------------------------------------------- #
# Content-based recommendations
# --------------------------------------------------------------------------- #
@lru_cache(maxsize=512)
def _similar_cached(tconst: str) -> list[dict]:
    con = get_db()
    base = con.execute("SELECT * FROM movies WHERE tconst = ?", (tconst,)).fetchone()
    if base is None:
        return []
    base_genres = {g for g in (base["genres"] or "").split(",") if g}
    if not base_genres:
        return []
    genre_clauses = " OR ".join(["genres LIKE ?"] * len(base_genres))
    params = [f"%,{g},%" for g in base_genres]

    candidates = con.execute(
        f"SELECT * FROM movies WHERE tconst != ? AND ({genre_clauses}) "
        "AND votes >= 2000 ORDER BY ABS(rating - ?) LIMIT 3000",
        [tconst] + params + [base["rating"] or 6],
    ).fetchall()

    b_votes = math.log10(max(base["votes"] or 1, 10))
    scored = []
    for c in candidates:
        cg = {g for g in (c["genres"] or "").split(",") if g}
        overlap = len(cg & base_genres) / len(base_genres)
        rating_prox = 1 - min(abs((c["rating"] or 0) - (base["rating"] or 0)) / 3, 1)
        vote_prox = 1 - min(abs(math.log10(max(c["votes"] or 1, 10)) - b_votes) / 2, 1)
        year_prox = 1 - min(abs(c["year"] - base["year"]) / 40, 1)
        score = 3.0 * overlap + 2.0 * rating_prox + 1.2 * vote_prox + 0.8 * year_prox
        scored.append((score, c))
    scored.sort(key=lambda t: (-t[0], -(t[1]["votes"] or 0)))
    return tmdb.enrich_movies([row_to_movie(c) for _, c in scored[:8]])


@router.get("/movies/{tconst}/similar")
def similar(tconst: str):
    items = _similar_cached(tconst)
    if not items:
        # distinguish "no recommendations" from "unknown movie"
        con = get_db()
        if con.execute("SELECT 1 FROM movies WHERE tconst = ?", (tconst,)).fetchone() is None:
            raise HTTPException(404, "Movie not found")
    return items
