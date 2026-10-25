"""
Cinelytics ETL pipeline
=======================
Builds the application database (cinelytics.db) from the official
IMDb non-commercial datasets (https://datasets.imdbws.com):

  title.basics.tsv.gz   -> core title metadata
  title.ratings.tsv.gz  -> average rating + vote counts
  title.crew.tsv.gz     -> director nconsts
  name.basics.tsv.gz    -> nconst -> person name

Pipeline stages
  1. Stream title.basics in chunks, keep theatrical movies with
     usable year / runtime / genres (adult titles excluded).
  2. Inner-join ratings (votes >= --min-votes) and crew.
  3. Stream name.basics to resolve director nconsts to names.
  4. Merge the curated "featured" collection (posters, overviews, cast)
     by normalized title + year.
  5. Write a compact SQLite database with indexes + an FTS5 full-text
     search table.

Usage:
    python scripts/build_db.py [--data-dir PATH] [--min-votes N]

Output: backend/cinelytics.db (~60 MB, rebuildable at any time)
"""
from __future__ import annotations

import argparse
import gzip
import json
import re
import sqlite3
import sys
import time
from pathlib import Path

import pandas as pd

CHUNK = 1_000_000
NA_VALUES = ["\\N", ""]

BACKEND_DIR = Path(__file__).resolve().parent.parent
REPO_DIR = BACKEND_DIR.parent
DEFAULT_OUT = BACKEND_DIR / "cinelytics.db"

CANDIDATE_DATA_DIRS = [
    REPO_DIR,
    BACKEND_DIR / "data",
    REPO_DIR.parent,
    Path.home() / "Downloads",
]


def log(msg: str) -> None:
    print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)


def find_file(name: str, data_dir: str | None) -> Path:
    candidates = [Path(data_dir)] if data_dir else []
    candidates += CANDIDATE_DATA_DIRS
    for d in candidates:
        p = d / name
        if p.is_file():
            return p
    sys.exit(f"FATAL: could not locate {name}. Searched: "
             + ", ".join(str(c) for c in candidates)
             + "\nDownload it from https://datasets.imdbws.com and re-run.")


def normalize_title(t: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", t.lower()).strip()


# --------------------------------------------------------------------------- #
# Stage 1 + 2: basics -> ratings -> crew
# --------------------------------------------------------------------------- #
def load_movies(basics_path: Path, ratings_path: Path, crew_path: Path,
                min_votes: int) -> pd.DataFrame:
    log("Stage 1/4: streaming title.basics.tsv.gz ...")
    keep_cols = ["tconst", "titleType", "primaryTitle", "originalTitle",
                 "isAdult", "startYear", "runtimeMinutes", "genres"]
    parts = []
    reader = pd.read_csv(
        basics_path, sep="\t", dtype=str, na_values=NA_VALUES,
        keep_default_na=False, quoting=3, chunksize=CHUNK,
        usecols=keep_cols,
    )
    for i, chunk in enumerate(reader):
        c = chunk[chunk["titleType"] == "movie"]
        c = c[c["isAdult"] == "0"]
        years = pd.to_numeric(c["startYear"], errors="coerce")
        runtimes = pd.to_numeric(c["runtimeMinutes"], errors="coerce")
        c = c[years.between(1900, 2100) & runtimes.between(1, 600)
              & c["genres"].notna() & (c["genres"] != "")]
        c = c.copy()
        c["startYear"] = years.loc[c.index].astype("int16")
        c["runtimeMinutes"] = runtimes.loc[c.index].astype("int16")
        parts.append(c)
        if (i + 1) % 5 == 0:
            log(f"  basics chunk {i + 1}, candidates so far: {sum(len(p) for p in parts):,}")

    movies = pd.concat(parts, ignore_index=True)
    log(f"  theatrical movie candidates: {len(movies):,}")

    log("Stage 2/4: joining ratings and crew ...")
    ratings = pd.read_csv(
        ratings_path, sep="\t", dtype={"tconst": str, "averageRating": "float32",
                                       "numVotes": "int32"},
        na_values=NA_VALUES, keep_default_na=False, quoting=3,
    )
    ratings = ratings[ratings["numVotes"] >= min_votes]
    movies = movies.merge(ratings, on="tconst", how="inner")
    log(f"  movies with >= {min_votes} votes: {len(movies):,}")

    wanted = set(movies["tconst"])
    crew_parts = []
    reader = pd.read_csv(
        crew_path, sep="\t", dtype=str, na_values=NA_VALUES,
        keep_default_na=False, quoting=3, chunksize=CHUNK,
        usecols=["tconst", "directors"],
    )
    for chunk in reader:
        chunk = chunk[chunk["tconst"].isin(wanted) & chunk["directors"].notna()]
        if len(chunk):
            crew_parts.append(chunk)
    if crew_parts:
        movies = movies.merge(pd.concat(crew_parts, ignore_index=True),
                              on="tconst", how="left")
    else:
        movies["directors"] = None
    return movies


# --------------------------------------------------------------------------- #
# Stage 3: resolve director names
# --------------------------------------------------------------------------- #
def attach_director_names(names_path: Path, movies: pd.DataFrame) -> pd.DataFrame:
    log("Stage 3/4: resolving director names from name.basics.tsv.gz ...")
    needed: set[str] = set()
    for d in movies["directors"].dropna():
        needed.update(x for x in d.split(",") if x)
    log(f"  unique director nconsts: {len(needed):,}")

    names: dict[str, str] = {}
    reader = pd.read_csv(
        names_path, sep="\t", dtype=str, na_values=NA_VALUES,
        keep_default_na=False, quoting=3, chunksize=CHUNK,
        usecols=["nconst", "primaryName"],
    )
    for chunk in reader:
        hit = chunk[chunk["nconst"].isin(needed)]
        if len(hit):
            names.update(zip(hit["nconst"], hit["primaryName"]))

    def to_names(cell: str | float) -> str | None:
        if not isinstance(cell, str):
            return None
        parts = [names.get(x, x) for x in cell.split(",") if x]
        return ", ".join(parts) if parts else None

    movies["director"] = movies["directors"].map(to_names)
    return movies.drop(columns=["directors"])


# --------------------------------------------------------------------------- #
# Stage 4: merge the curated featured collection
# --------------------------------------------------------------------------- #
def merge_featured(featured_path: Path, movies: pd.DataFrame) -> tuple[pd.DataFrame, int]:
    log("Stage 4/4: merging curated featured collection ...")
    featured = json.loads(featured_path.read_text(encoding="utf-8"))

    by_key: dict[tuple[str, int], int] = {}
    for idx, row in movies.iterrows():
        by_key.setdefault((normalize_title(row["primaryTitle"]), int(row["startYear"])), idx)
        by_key.setdefault((normalize_title(row["originalTitle"]), int(row["startYear"])), idx)

    movies["featured"] = 0
    movies["poster"] = None
    movies["backdrop"] = None
    movies["overview"] = None
    movies["cast"] = None
    movies["certificate"] = None
    movies["revenue_musd"] = None
    matched = 0
    orphan_rows = []
    for f in featured:
        payload = {
            "poster": f.get("poster"), "backdrop": f.get("backdrop"),
            "overview": f.get("overview"),
            "cast": ", ".join(f.get("cast") or []),
            "certificate": f.get("certificate"),
            "revenue_musd": f.get("revenue"),
        }
        idx = by_key.get((normalize_title(f["title"]), int(f["year"])))
        if idx is not None:
            matched += 1
            for k, v in payload.items():
                movies.at[idx, k] = v
            movies.at[idx, "featured"] = 1
        else:  # keep the curated entry even if IMDb has no match
            payload.update(tconst=f"feat-{f['id']:04d}", primaryTitle=f["title"],
                           originalTitle=f["title"], startYear=f["year"],
                           runtimeMinutes=f.get("runtime"), rating=f.get("rating"),
                           numVotes=f.get("votes"), genres="/".join(f.get("genres") or []),
                           director=f.get("director"), featured=1)
            orphan_rows.append(payload)
    if orphan_rows:
        movies = pd.concat([movies, pd.DataFrame(orphan_rows)], ignore_index=True)
    log(f"  featured matched against IMDb: {matched}/{len(featured)}")
    return movies, matched


# --------------------------------------------------------------------------- #
# Write SQLite
# --------------------------------------------------------------------------- #
def write_db(out_path: Path, movies: pd.DataFrame) -> None:
    log(f"Writing {out_path} ...")
    if out_path.exists():
        out_path.unlink()
    con = sqlite3.connect(out_path)

    df = movies.rename(columns={
        "tconst": "tconst", "primaryTitle": "title", "originalTitle": "original_title",
        "startYear": "year", "runtimeMinutes": "runtime", "averageRating": "rating",
        "numVotes": "votes", "director": "director",
    })
    df["decade"] = (df["year"] // 10 * 10).astype("int16")
    # store padded ("Action,Drama" -> ",Action,Drama,") so genre filters can
    # use exact LIKE '%,Action,%' matching without substring collisions
    df["genres"] = ("," + df["genres"].fillna("").str.replace("/", ",", regex=False) + ",")
    df["cast"] = df["cast"].fillna("")
    df = df[["tconst", "title", "original_title", "year", "decade", "runtime",
             "rating", "votes", "genres", "director", "featured", "poster",
             "backdrop", "overview", "cast", "certificate", "revenue_musd"]]

    con.execute("""
        CREATE TABLE movies (
            tconst       TEXT PRIMARY KEY,
            title        TEXT NOT NULL,
            original_title TEXT,
            year         INTEGER,
            decade       INTEGER,
            runtime      INTEGER,
            rating       REAL,
            votes        INTEGER,
            genres       TEXT,
            director     TEXT,
            featured     INTEGER DEFAULT 0,
            poster       TEXT,
            backdrop     TEXT,
            overview     TEXT,
            "cast"       TEXT,
            certificate  TEXT,
            revenue_musd REAL
        )""")
    con.executemany(
        "INSERT INTO movies VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        df.itertuples(index=False, name=None),
    )

    con.execute("CREATE INDEX idx_movies_year   ON movies(year)")
    con.execute("CREATE INDEX idx_movies_rating ON movies(rating)")
    con.execute("CREATE INDEX idx_movies_votes  ON movies(votes)")
    con.execute("CREATE INDEX idx_movies_decade ON movies(decade)")

    con.execute("""
        CREATE VIRTUAL TABLE movies_fts USING fts5(
            title, original_title, director, "cast",
            content='movies', content_rowid='rowid'
        )""")
    con.execute("""
        INSERT INTO movies_fts(rowid, title, original_title, director, "cast")
        SELECT rowid, title, original_title, director, "cast" FROM movies
    """)

    con.execute("""
        CREATE TABLE stats (
            key TEXT PRIMARY KEY, value TEXT
        )""")
    con.executemany("INSERT INTO stats VALUES (?,?)", [
        ("total_movies", str(len(df))),
        ("featured", str(int(df["featured"].sum()))),
        ("min_year", str(int(df["year"].min()))),
        ("max_year", str(int(df["year"].max()))),
        ("min_votes_threshold", str(int(df["votes"].min()))),
        ("built_at", time.strftime("%Y-%m-%d %H:%M:%S")),
    ])
    con.commit()

    n = con.execute("SELECT COUNT(*) FROM movies").fetchone()[0]
    size_mb = out_path.stat().st_size / 1e6
    con.close()
    log(f"DONE: {n:,} movies, {size_mb:.1f} MB")


def main() -> None:
    ap = argparse.ArgumentParser(description="Build the Cinelytics SQLite database")
    ap.add_argument("--data-dir", default=None, help="folder containing the IMDb .tsv.gz files")
    ap.add_argument("--min-votes", type=int, default=100,
                    help="minimum IMDb votes for a movie to be included (default 100)")
    ap.add_argument("--out", default=str(DEFAULT_OUT))
    args = ap.parse_args()

    basics = find_file("title.basics.tsv.gz", args.data_dir)
    ratings = find_file("title.ratings.tsv.gz", args.data_dir)
    crew = find_file("title.crew.tsv.gz", args.data_dir)
    names = find_file("name.basics.tsv.gz", args.data_dir)
    featured = BACKEND_DIR / "data" / "featured.json"
    log(f"basics={basics}")
    log(f"ratings={ratings}")
    log(f"crew={crew}")
    log(f"names={names}")

    movies = load_movies(basics, ratings, crew, args.min_votes)
    movies = attach_director_names(names, movies)
    movies, _ = merge_featured(featured, movies)
    write_db(Path(args.out), movies)


if __name__ == "__main__":
    main()
