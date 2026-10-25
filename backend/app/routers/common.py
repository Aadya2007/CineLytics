"""Shared helpers used by both routers (kept here to avoid circular imports)."""
from __future__ import annotations

import re
import sqlite3
from functools import lru_cache

from ..db import get_db


def row_to_movie(r: sqlite3.Row) -> dict:
    rating = round(r["rating"], 1) if r["rating"] is not None else None
    return {
        "tconst": r["tconst"],
        "title": r["title"],
        "original_title": r["original_title"],
        "year": r["year"],
        "runtime": r["runtime"],
        "rating": rating,
        "votes": r["votes"],
        "genres": [g for g in (r["genres"] or "").split(",") if g],
        "director": r["director"],
        "featured": bool(r["featured"]),
        "poster": r["poster"],
        "backdrop": r["backdrop"],
        "overview": r["overview"],
    }


def row_to_detail(r: sqlite3.Row) -> dict:
    d = row_to_movie(r)
    d.update(
        overview=r["overview"],
        cast=[c for c in (r["cast"] or "").split(",") if c],
        certificate=r["certificate"],
        revenue_musd=r["revenue_musd"],
        decade=r["decade"],
    )
    return d


def fts_query(q: str) -> str:
    """Turn free text into a safe FTS5 prefix query: 'star wars' -> '"star"* "wars"*'."""
    tokens = re.findall(r"\w+", q)[:6]
    return " ".join(f'"{t}"*' for t in tokens)


@lru_cache(maxsize=1)
def genre_names() -> list[dict]:
    """Explode padded genre strings -> per-genre count / avg rating / avg votes."""
    acc: dict[str, list] = {}
    for genres, rating, votes in get_db().execute(
        "SELECT genres, rating, votes FROM movies WHERE rating IS NOT NULL"
    ):
        for g in (genres or "").split(","):
            if not g:
                continue
            a = acc.setdefault(g, [0, 0.0, 0])
            a[0] += 1
            a[1] += rating
            a[2] += votes
    out = [
        {"genre": g, "count": c[0], "avg_rating": round(c[1] / c[0], 2),
         "avg_votes": round(c[2] / c[0])}
        for g, c in acc.items()
    ]
    out.sort(key=lambda x: -x["count"])
    return out
