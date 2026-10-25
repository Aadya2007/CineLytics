"""Pydantic response models (drives the OpenAPI docs)."""
from __future__ import annotations

from pydantic import BaseModel


class Movie(BaseModel):
    tconst: str
    title: str
    original_title: str | None = None
    year: int
    runtime: int | None = None
    rating: float | None = None
    votes: int | None = None
    genres: list[str] = []
    director: str | None = None
    featured: bool = False
    poster: str | None = None
    backdrop: str | None = None


class MovieDetail(Movie):
    overview: str | None = None
    cast: list[str] = []
    certificate: str | None = None
    revenue_musd: float | None = None
    decade: int | None = None


class Page(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    items: list[Movie]


class GenreStat(BaseModel):
    genre: str
    count: int
    avg_rating: float
    avg_votes: float


class DecadeStat(BaseModel):
    decade: int
    count: int
    avg_rating: float


class YearPoint(BaseModel):
    year: int
    count: int
    avg_rating: float


class HistogramBin(BaseModel):
    label: str
    count: int


class ScatterPoint(BaseModel):
    rating: float
    votes: int
    runtime: int


class DirectorStat(BaseModel):
    name: str
    movies: int
    avg_rating: float
    best_title: str
    best_rating: float


class Overview(BaseModel):
    total_movies: int
    avg_rating: float
    total_votes: int
    avg_runtime: float
    genre_count: int
    year_min: int
    year_max: int
    built_at: str
    top_movie: Movie | None = None
    most_voted: Movie | None = None
