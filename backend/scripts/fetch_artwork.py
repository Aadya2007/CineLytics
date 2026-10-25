"""
Bulk artwork warmer — pre-fetches TMDB posters/backdrops into the `artwork`
table so browse pages load with real posters instantly (no lazy fetch needed).

Requires TMDB_API_KEY in backend/.env or the environment.
Resumable: movies already in the artwork table are skipped; re-run any time to
continue. Use --retry-misses to re-check movies TMDB didn't know earlier.

Usage:
    python scripts/fetch_artwork.py [--limit 25000] [--retry-misses]
"""
from __future__ import annotations

import argparse
import sqlite3
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import tmdb  # noqa: E402  (loads .env on import)
from app.db import DB_PATH  # noqa: E402


def main() -> None:
    ap = argparse.ArgumentParser(description="Pre-fetch TMDB artwork into the cache")
    ap.add_argument("--limit", type=int, default=25000,
                    help="how many movies (most-voted first) to warm (default 25000)")
    ap.add_argument("--retry-misses", action="store_true",
                    help="re-check movies TMDB previously didn't know")
    ap.add_argument("--workers", type=int, default=12)
    args = ap.parse_args()

    if not tmdb.ENABLED:
        sys.exit("TMDB_API_KEY is not set. Add it to backend/.env — free key: "
                 "https://www.themoviedb.org/settings/api")
    if tmdb._DISABLED:
        sys.exit("TMDB lookup is disabled (auth failed earlier). Restart/re-run "
                 "after fixing TMDB_API_KEY.")

    con = sqlite3.connect(DB_PATH, timeout=30)
    con.row_factory = sqlite3.Row
    tmdb._ensure_table(con)

    miss_filter = "" if args.retry_misses else "AND (a.miss IS NULL OR a.miss = 0)"
    rows = con.execute(
        f"""
        SELECT m.tconst FROM movies m
        LEFT JOIN artwork a ON a.tconst = m.tconst
        WHERE a.tconst IS NULL {miss_filter}
        ORDER BY m.votes DESC
        LIMIT ?
        """,
        (args.limit,),
    ).fetchall()
    total = len(rows)
    print(f"Warming artwork for {total:,} movies (most-voted first, "
          f"{args.workers} workers)...")

    def work(tconst: str) -> tuple[str, str | None, str | None]:
        poster, backdrop = tmdb.lookup(tconst)
        return tconst, poster, backdrop

    done = found = 0
    batch: list[tuple[str, str | None, str | None]] = []
    started = time.time()
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        for result in pool.map(work, [r["tconst"] for r in rows]):
            batch.append(result)
            done += 1
            if result[1] or result[2]:
                found += 1
            if len(batch) >= 500 or done == total:
                with tmdb._LOCK:
                    con.executemany(
                        "INSERT OR REPLACE INTO artwork VALUES (?,?,?,?)",
                        [(t, p, b, 0 if (p or b) else 1) for t, p, b in batch],
                    )
                    con.commit()
                rate = done / max(time.time() - started, 0.1)
                print(f"  {done:,}/{total:,} done · {found:,} with artwork · "
                      f"{rate:.0f}/s", flush=True)
                batch.clear()

    cached = con.execute("SELECT COUNT(*) FROM artwork WHERE miss = 0").fetchone()[0]
    print(f"DONE: artwork table now covers {cached:,} movies.")


if __name__ == "__main__":
    main()
