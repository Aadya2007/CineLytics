export interface Movie {
  tconst: string
  title: string
  original_title: string | null
  year: number
  runtime: number | null
  rating: number | null
  votes: number | null
  genres: string[]
  director: string | null
  featured: boolean
  poster: string | null
  backdrop: string | null
  overview: string | null
}

export interface MovieDetail extends Movie {
  overview: string | null
  cast: string[]
  certificate: string | null
  revenue_musd: number | null
  decade: number | null
}

export interface Page<T> {
  total: number
  page: number
  page_size: number
  total_pages: number
  items: T[]
}

export interface GenreStat {
  genre: string
  count: number
  avg_rating: number
  avg_votes: number
}

export interface DecadeStat {
  decade: number
  count: number
  avg_rating: number
}

export interface YearPoint {
  year: number
  count: number
  avg_rating: number
}

export interface HistogramBin {
  label: string
  count: number
  avg_rating?: number | null
}

export interface ScatterPoint {
  rating: number
  votes: number
  runtime: number
}

export interface DirectorStat {
  name: string
  movies: number
  avg_rating: number
  best_title: string
  best_rating: number
}

export interface Overview {
  total_movies: number
  avg_rating: number
  total_votes: number
  avg_runtime: number
  genre_count: number
  year_min: number
  year_max: number
  built_at: string
  top_movie: Movie | null
  most_voted: Movie | null
}

export interface Collection {
  slug: string
  label: string
  items: Movie[]
}
