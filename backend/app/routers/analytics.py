"""Analytics endpoints — SQL aggregations over the movies table, cached in
memory (the database is static between rebuilds)."""
from __future__ import annotations

import sqlite3

from fastapi import APIRouter, Query

from ..db import get_db
from .common import genre_names, row_to_movie

router = APIRouter(prefix="/api/analytics")


def _con() -> sqlite3.Connection:
    return get_db()


@router.get("/overview")
def overview():
    con = _con()
    stats = dict(con.execute("SELECT key, value FROM stats").fetchall())
    total = con.execute("SELECT COUNT(*) FROM movies").fetchone()[0]
    agg = con.execute(
        "SELECT AVG(rating), SUM(votes), AVG(runtime) FROM movies "
        "WHERE rating IS NOT NULL"
    ).fetchone()
    top = con.execute(
        "SELECT * FROM movies WHERE votes >= 250000 ORDER BY rating DESC LIMIT 1"
    ).fetchone()
    most_voted = con.execute(
        "SELECT * FROM movies ORDER BY votes DESC LIMIT 1"
    ).fetchone()
    return {
        "total_movies": total,
        "avg_rating": round(agg[0], 2),
        "total_votes": agg[1],
        "avg_runtime": round(agg[2], 1),
        "genre_count": len(genre_names()),
        "year_min": int(stats.get("min_year", 0)),
        "year_max": int(stats.get("max_year", 0)),
        "built_at": stats.get("built_at", ""),
        "top_movie": row_to_movie(top) if top else None,
        "most_voted": row_to_movie(most_voted) if most_voted else None,
    }


@router.get("/genres")
def genres():
    return genre_names()


@router.get("/decades")
def decades():
    rows = _con().execute(
        "SELECT decade, COUNT(*) AS c, AVG(rating) AS ar FROM movies "
        "WHERE rating IS NOT NULL GROUP BY decade ORDER BY decade"
    ).fetchall()
    return [{"decade": r["decade"], "count": r["c"],
             "avg_rating": round(r["ar"], 2)} for r in rows]


@router.get("/ratings-histogram")
def ratings_histogram():
    rows = _con().execute(
        "SELECT CAST(rating * 2 AS INT) / 2.0 AS bucket, COUNT(*) AS c "
        "FROM movies WHERE rating IS NOT NULL GROUP BY bucket ORDER BY bucket"
    ).fetchall()
    return [{"label": f"{r['bucket']:.1f}", "count": r["c"]} for r in rows]


@router.get("/runtime-histogram")
def runtime_histogram():
    buckets = [(60, "< 60 min"), (90, "60–90"), (110, "90–110"), (130, "110–130"),
               (150, "130–150"), (180, "150–180"), (10000, "> 180 min")]
    result, lower = [], 0
    for upper, label in buckets:
        r = _con().execute(
            "SELECT COUNT(*) AS c, AVG(rating) AS ar FROM movies "
            "WHERE runtime > ? AND runtime <= ? AND rating IS NOT NULL",
            (lower, upper),
        ).fetchone()
        result.append({"label": label, "count": r["c"],
                       "avg_rating": round(r["ar"], 2) if r["ar"] else None})
        lower = upper
    return result


@router.get("/timeline")
def timeline(year_from: int = Query(1920), year_to: int = Query(2026)):
    rows = _con().execute(
        "SELECT year, COUNT(*) AS c, AVG(rating) AS ar FROM movies "
        "WHERE year BETWEEN ? AND ? AND rating IS NOT NULL "
        "GROUP BY year ORDER BY year",
        (year_from, year_to),
    ).fetchall()
    return [{"year": r["year"], "count": r["c"],
             "avg_rating": round(r["ar"], 2)} for r in rows]


@router.get("/votes-vs-rating")
def votes_vs_rating(sample_every: int = Query(90, ge=10, le=500)):
    rows = _con().execute(
        "SELECT rating, votes, runtime FROM movies "
        "WHERE rating IS NOT NULL AND rowid % ? = 0", (sample_every,)
    ).fetchall()
    top = _con().execute(
        "SELECT rating, votes, runtime FROM movies ORDER BY votes DESC LIMIT 400"
    ).fetchall()
    seen = {(r["rating"], r["votes"]) for r in rows}
    rows = list(rows) + [r for r in top if (r["rating"], r["votes"]) not in seen]
    return [{"rating": r["rating"], "votes": r["votes"], "runtime": r["runtime"]}
            for r in rows]


@router.get("/top-directors")
def top_directors(
    min_movies: int = Query(8, ge=2, le=100),
    min_votes: int = Query(100000, ge=0),
    limit: int = Query(15, ge=1, le=50),
):
    rows = _con().execute(
        "SELECT director, COUNT(*) AS c, AVG(rating) AS ar, "
        "MAX(rating) AS best_r FROM movies "
        "WHERE director IS NOT NULL AND rating IS NOT NULL "
        "GROUP BY director HAVING c >= ? AND AVG(votes) >= ? "
        "ORDER BY ar DESC LIMIT ?",
        (min_movies, min_votes, limit),
    ).fetchall()
    out = []
    con = _con()
    for r in rows:
        best = con.execute(
            "SELECT title, rating FROM movies WHERE director = ? AND rating IS NOT NULL "
            "ORDER BY rating DESC LIMIT 1", (r["director"],),
        ).fetchone()
        out.append({"name": r["director"], "movies": r["c"],
                    "avg_rating": round(r["ar"], 2),
                    "best_title": best["title"] if best else "",
                    "best_rating": best["rating"] if best else 0})
    return out
