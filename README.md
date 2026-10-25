# 🎬 Cinelytics — Movie Insights Platform

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Cinelytics-e50914?style=for-the-badge&logo=render&logoColor=white)](https://cinelytics-zjm6.onrender.com/)
[![API Docs](https://img.shields.io/badge/OpenAPI-Swagger%20UI-008080?style=for-the-badge&logo=fastapi&logoColor=white)](https://cinelytics-zjm6.onrender.com/docs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

> 🚀 **Live Demo:** Explore the live platform at **[https://cinelytics-zjm6.onrender.com/](https://cinelytics-zjm6.onrender.com/)**  
> 📖 **API Docs:** Interactive OpenAPI docs available at **[https://cinelytics-zjm6.onrender.com/docs](https://cinelytics-zjm6.onrender.com/docs)**

A full-stack movie analytics platform built on the **official IMDb datasets** — 137,000+
real theatrical movies with verified ratings, vote counts, runtimes, genres and named
directors. Search it, filter it, chart it, and get content-based recommendations.

> **v2 rewrite.** Cinelytics started as a 30-movie vanilla-JS page (v1) and a 60-row
> Streamlit dashboard (v0). This version is a proper data product: a Python ETL
> pipeline, a FastAPI service, and a React 19 + TypeScript front-end.

---

## 🌐 Deploy to Render (100% Free)

Deploy the entire platform (FastAPI backend + React frontend + SQLite dataset) with a single click:

1. Sign up or log in to [**Render.com**](https://render.com) with your GitHub account (**Aadya2007**).
2. Click **New +** -> **Web Service**.
3. Select your repository: **Aadya2007/CineLytics**.
4. Render will automatically detect render.yaml and configure:
   - **Environment**: Docker
   - **Plan**: Free
5. Click **Deploy Web Service**!

Render will build and give you a free live URL (e.g. `https://cinelytics.onrender.com`).

---

## ✨ What it does

| Area | Features |
|---|---|
| **Home** | Auto-rotating cinematic hero, live KPI strip, five curated collections (Top Rated, Trending, Hidden Gems, Classics, Featured 30) |
| **Discover** | Full-text search (titles, directors, cast), genre/year/rating/votes facets, weighted-rating sort, URL-synced shareable filter state, pagination |
| **Analytics** | Seven live ECharts visualisations — century timeline, ratings distribution, genre landscape, votes-vs-rating scatter, runtime profile, nostalgia curve, top directors |
| **Movie pages** | Backdrop hero, rating ring, box office / cast / certificate data, and content-based recommendations |
| **Watchlist** | One-tap bookmarking, persisted in `localStorage`, reactive badge |
| **API** | Self-documenting OpenAPI at `/docs` |

Highlights worth a look (great viva talking points):

- **Bayesian weighted rating** (IMDb's own WR formula) — sorting by rating can't be
  gamed by 300-vote troll entries; `(v/(v+m))·R + (m/(v+m))·C` with `m = 1500`.
- **FTS5 full-text search** over 137k rows with BM25 relevance ranking.
- **Content-based recommender** — scores every candidate on genre overlap, rating
  proximity, log-votes proximity and era proximity.
- **Deterministic typographic posters** — non-featured films get a generated
  gradient/typography poster derived from a hash of their IMDb id, so the grid looks
  intentional at any scale.

## 🏗 Architecture

```
IMDb datasets (title.basics / title.ratings / title.crew / name.basics .tsv.gz)
        │  scripts/build_db.py  — chunked pandas ETL
        ▼
SQLite (movies table + indexes + FTS5 full-text index)  ~34 MB
        │  FastAPI  (uvicorn)
        ▼
REST API  /api/movies · /api/collections · /api/movies/{id}/similar · /api/analytics/*
        │  Vite dev proxy  →  :8001
        ▼
React 19 + TypeScript + Tailwind CSS 4 + ECharts + Framer Motion
```

## 🚀 Run it

### 1 · Get the data (one-time)

Download the four IMDb datasets into any of: `backend/data/`, the repo root, or the
repo's parent folder (the loader checks several locations):

- [title.basics.tsv.gz](https://datasets.imdbws.com/title.basics.tsv.gz) (~250 MB)
- [title.ratings.tsv.gz](https://datasets.imdbws.com/title.ratings.tsv.gz) (~8 MB)
- [title.crew.tsv.gz](https://datasets.imdbws.com/title.crew.tsv.gz) (~80 MB)
- [name.basics.tsv.gz](https://datasets.imdbws.com/name.basics.tsv.gz) (~300 MB)

### 2 · Build the database (one-time, ~2–3 min)

```bash
cd backend
python -m venv .venv
.venv/Scripts/pip install -r requirements.txt      # Windows
# .venv/bin/pip install -r requirements.txt        # macOS / Linux
.venv/Scripts/python scripts/build_db.py
```

### 3 · Start the backend

```bash
cd backend
.venv/Scripts/python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
# API docs: http://127.0.0.1:8001/docs
```

### 4 · Start the frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173 (or 5174 if 5173 is taken)
```

### Or: production mode (single process)

```bash
cd frontend && npm run build     # emits frontend/dist
cd ../backend && uvicorn app.main:app --port 8001
# → the API now also serves the built SPA at http://127.0.0.1:8001/
```

### Optional: real posters for every movie 🖼

IMDb's datasets contain no images, so non-featured movies show generated
typographic posters by default. To fill in real posters/backdrops:

1. Grab a **free TMDB API key**: https://www.themoviedb.org/settings/api
2. `cp backend/.env.example backend/.env` and put the key in `TMDB_API_KEY=...`
3. Warm the artwork cache (resumable — run it in the background if you like):

```bash
cd backend
.venv/Scripts/python scripts/fetch_artwork.py --limit 10000   # top 10k by votes
.venv/Scripts/python scripts/fetch_artwork.py --limit 50000   # go deeper
.venv/Scripts/python scripts/fetch_artwork.py --retry-misses  # re-check misses
```

Browse pages read the cache (instant); any movie page you open directly also
resolves its own artwork lazily, so the cache keeps growing as you explore.
If the key is invalid, the app detects it and keeps running with generated
posters — check `GET /api/health` → `"tmdb_artwork": false`.

This product uses the TMDB API but is not endorsed or certified by TMDB.

`start-dev.bat` (Windows) / `start-dev.sh` (macOS/Linux) do steps 3+4 in one shot.

## 🔌 API quick reference

| Endpoint | Purpose |
|---|---|
| `GET /api/movies` | Faceted browse: `search, genre, year_from, year_to, min_rating, min_votes, sort, order, page, page_size` |
| `GET /api/movies/{tconst}` | Full detail (overview, cast, certificate, revenue) |
| `GET /api/movies/{tconst}/similar` | Content-based recommendations |
| `GET /api/movies/featured` | The curated 30 (with TMDB artwork) |
| `GET /api/collections/{slug}` | top-rated · trending · hidden-gems · classics |
| `GET /api/analytics/overview` | KPI summary |
| `GET /api/analytics/genres` | Per-genre counts, avg rating, avg votes |
| `GET /api/analytics/timeline` | Yearly releases + avg rating |
| `GET /api/analytics/ratings-histogram` · `runtime-histogram` · `decades` · `votes-vs-rating` · `top-directors` | Chart feeds |

## 📁 Project structure

```
Cinelytics/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app, CORS, SPA serving
│   │   ├── db.py              # SQLite connection helper
│   │   └── routers/
│   │       ├── movies.py      # browse / search / detail / similar / collections
│   │       ├── analytics.py   # aggregation endpoints
│   │       └── common.py      # shared row mappers + cached genre stats
│   ├── scripts/build_db.py    # the ETL pipeline
│   ├── data/featured.json     # curated 30 (posters, overviews, cast)
│   ├── requirements.txt
│   └── cinelytics.db          # generated (~34 MB, gitignored)
├── frontend/
│   └── src/
│       ├── components/        # Layout, Hero, MovieCard, MovieRow, Poster, EChart…
│       ├── pages/             # Home, Discover, Analytics, MovieDetail, Watchlist, About
│       ├── hooks/             # useApi, useDebounce, useWatchlist
│       └── lib/               # typed API client, types, utils
├── start-dev.bat / start-dev.sh
└── README.md
```

## 🛠 Tech stack

**Data** Python · pandas · official IMDb datasets • **Storage** SQLite + FTS5 •
**API** FastAPI · Uvicorn · OpenAPI • **Front-end** React 19 · TypeScript · Tailwind
CSS 4 · Apache ECharts · Framer Motion · lucide-react

## 📄 License

MIT — see [LICENSE](LICENSE).

---

<p align="center">Built with 💙 for cinephiles and data nerds alike.</p>
