import type {
  Collection,
  DecadeStat,
  DirectorStat,
  GenreStat,
  HistogramBin,
  Movie,
  MovieDetail,
  Overview,
  Page,
  ScatterPoint,
  YearPoint,
} from './types'

const BASE = import.meta.env.VITE_API_URL ?? ''

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  const qs = params
    ? '?' +
      new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== '' && v !== null && v !== undefined)
          .map(([k, v]) => [k, String(v)]),
      ).toString()
    : ''
  const res = await fetch(`${BASE}/api${path}${qs}`)
  if (!res.ok) {
    let detail = res.statusText
    try {
      detail = (await res.json()).detail ?? detail
    } catch {
      /* keep statusText */
    }
    throw new ApiError(res.status, detail)
  }
  return res.json()
}

export interface MovieQuery {
  search?: string
  genre?: string
  year_from?: number
  year_to?: number
  min_rating?: number
  min_votes?: number
  max_runtime?: number
  sort?: string
  order?: string
  page?: number
  page_size?: number
}

export const api = {
  movies: (q: MovieQuery) => get<Page<Movie>>('/movies', q as Record<string, unknown>),
  movie: (tconst: string) => get<MovieDetail>(`/movies/${tconst}`),
  similar: (tconst: string) => get<Movie[]>(`/movies/${tconst}/similar`),
  featured: () => get<Movie[]>('/movies/featured'),
  collection: (slug: string) => get<Collection>(`/collections/${slug}`),
  genres: () => get<string[]>('/genres'),

  overview: () => get<Overview>('/analytics/overview'),
  genreStats: () => get<GenreStat[]>('/analytics/genres'),
  decades: () => get<DecadeStat[]>('/analytics/decades'),
  ratingsHistogram: () => get<HistogramBin[]>('/analytics/ratings-histogram'),
  runtimeHistogram: () => get<HistogramBin[]>('/analytics/runtime-histogram'),
  timeline: () => get<YearPoint[]>('/analytics/timeline'),
  votesVsRating: () => get<ScatterPoint[]>('/analytics/votes-vs-rating'),
  topDirectors: () => get<DirectorStat[]>('/analytics/top-directors'),
}
