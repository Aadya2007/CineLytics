import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, SlidersHorizontal, X } from 'lucide-react'
import { api } from '../lib/api'
import type { Page, Movie } from '../lib/types'
import { cn } from '../lib/utils'
import { useApi } from '../hooks/useApi'
import { useDebounce } from '../hooks/useDebounce'
import MovieCard from '../components/MovieCard'
import { EmptyState, ErrorState, GridSkeleton } from '../components/Bits'

const VOTE_OPTIONS = [0, 1000, 10_000, 50_000, 100_000, 500_000]
const SORTS = [
  { value: 'votes', label: 'Popularity (votes)' },
  { value: 'rating', label: 'Rating' },
  { value: 'year', label: 'Release year' },
  { value: 'title', label: 'Title (A–Z)' },
]

interface Filters {
  q: string
  genres: string[]
  yearFrom: number
  yearTo: number
  minRating: number
  minVotes: number
  sort: string
  order: string
  page: number
}

const DEFAULTS: Filters = {
  q: '',
  genres: [],
  yearFrom: 1920,
  yearTo: 2025,
  minRating: 0,
  minVotes: 0,
  sort: 'votes',
  order: 'desc',
  page: 1,
}

function readFilters(sp: URLSearchParams): Filters {
  const num = (k: string, d: number) => {
    const v = Number(sp.get(k))
    return Number.isFinite(v) && sp.has(k) && v !== 0 ? v : d
  }
  return {
    q: sp.get('q') ?? '',
    genres: (sp.get('genres') ?? '').split(',').filter(Boolean),
    yearFrom: num('from', DEFAULTS.yearFrom),
    yearTo: num('to', DEFAULTS.yearTo),
    minRating: Number(sp.get('rating') ?? 0) || 0,
    minVotes: Number(sp.get('votes') ?? 0) || 0,
    sort: sp.get('sort') ?? DEFAULTS.sort,
    order: sp.get('order') ?? DEFAULTS.order,
    page: num('page', 1),
  }
}

function writeFilters(f: Filters): URLSearchParams {
  const sp = new URLSearchParams()
  const set = (k: string, v: string | number) => {
    if (String(v) !== '' && v !== null && v !== undefined) sp.set(k, String(v))
  }
  if (f.q) set('q', f.q)
  if (f.genres.length) set('genres', f.genres.join(','))
  if (f.yearFrom !== DEFAULTS.yearFrom) set('from', f.yearFrom)
  if (f.yearTo !== DEFAULTS.yearTo) set('to', f.yearTo)
  if (f.minRating) set('rating', f.minRating)
  if (f.minVotes) set('votes', f.minVotes)
  if (f.sort !== DEFAULTS.sort) set('sort', f.sort)
  if (f.order !== DEFAULTS.order) set('order', f.order)
  if (f.page !== 1) set('page', f.page)
  return sp
}

export default function Discover() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(() => readFilters(searchParams), [searchParams])
  const [showFilters, setShowFilters] = useState(false)

  const debouncedQ = useDebounce(filters.q, 350)
  const activeQ = debouncedQ === filters.q ? filters : { ...filters, q: debouncedQ }

  const update = (patch: Partial<Filters>, resetPage = true) => {
    const next = { ...filters, ...patch, ...(resetPage ? { page: 1 } : {}) }
    setSearchParams(writeFilters(next), { replace: true })
  }

  const query = useApi<Page<Movie>>(
    () =>
      api.movies({
        search: activeQ.q || undefined,
        genre: activeQ.genres.join(',') || undefined,
        year_from: activeQ.yearFrom,
        year_to: activeQ.yearTo,
        min_rating: activeQ.minRating || undefined,
        min_votes: activeQ.minVotes || undefined,
        sort: activeQ.sort,
        order: activeQ.order,
        page: activeQ.page,
        page_size: 24,
      }),
    [activeQ.q, activeQ.genres.join(','), activeQ.yearFrom, activeQ.yearTo, activeQ.minRating, activeQ.minVotes, activeQ.sort, activeQ.order, activeQ.page],
  )
  const genres = useApi<string[]>(() => api.genres(), [])

  const activeFilterCount =
    (filters.genres.length ? 1 : 0) +
    (filters.minRating ? 1 : 0) +
    (filters.minVotes ? 1 : 0) +
    (filters.yearFrom !== DEFAULTS.yearFrom || filters.yearTo !== DEFAULTS.yearTo ? 1 : 0)

  const pageItems = query.data
  const pageWindow = useMemo(() => {
    if (!pageItems) return []
    const { page, total_pages } = pageItems
    const pages: (number | '…')[] = []
    const push = (p: number | '…') => pages.push(p)
    if (total_pages <= 9) {
      for (let p = 1; p <= total_pages; p++) push(p)
    } else {
      push(1)
      if (page > 4) push('…')
      for (let p = Math.max(2, page - 2); p <= Math.min(total_pages - 1, page + 2); p++) push(p)
      if (page < total_pages - 3) push('…')
      push(total_pages)
    }
    return pages
  }, [pageItems])

  return (
    <div className="pb-10 pt-6 md:pt-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 px-4 md:px-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-white md:text-3xl">Discover</h1>
          <p className="mt-1 text-sm text-mist-400">
            {query.loading
              ? 'Searching…'
              : pageItems
                ? `${pageItems.total.toLocaleString()} movies match your filters`
                : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors',
              showFilters || activeFilterCount
                ? 'border-accent-500/50 bg-accent-500/15 text-accent-300'
                : 'border-white/10 bg-ink-850 text-mist-300 hover:text-white',
            )}
          >
            <SlidersHorizontal size={15} />
            Filters
            {activeFilterCount > 0 && (
              <span className="grid h-4.5 w-4.5 place-items-center rounded-full bg-accent-500 text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
          <select
            value={`${filters.sort}:${filters.order}`}
            onChange={(e) => {
              const [sort, order] = e.target.value.split(':')
              update({ sort, order })
            }}
            className="rounded-xl border border-white/10 bg-ink-850 px-3 py-2 text-sm text-mist-300 outline-none focus:border-accent-500/60"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={`${s.value}:desc`}>
                {s.label} ↓
              </option>
            ))}
            <option value="year:asc">Release year ↑</option>
            <option value="title:asc">Title (A–Z)</option>
          </select>
        </div>
      </div>

      {/* search bar */}
      <div className="px-4 md:px-8">
        <input
          value={filters.q}
          onChange={(e) => update({ q: e.target.value })}
          placeholder="Search by title, director or cast — e.g. “Nolan”, “lovecraft”, “Zelda”…"
          className="w-full rounded-2xl border border-white/10 bg-ink-850/80 px-5 py-3.5 text-[15px] text-mist-200 placeholder:text-mist-400/60 outline-none transition-colors focus:border-accent-500/60 focus:bg-ink-800"
        />
      </div>

      {/* filter panel */}
      {showFilters && (
        <div className="mx-4 mt-4 card-surface p-5 md:mx-8">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-mist-400">Genres</p>
              <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto pr-1">
                {(genres.data ?? []).map((g) => {
                  const on = filters.genres.includes(g)
                  return (
                    <button
                      key={g}
                      onClick={() =>
                        update({
                          genres: on ? filters.genres.filter((x) => x !== g) : [...filters.genres, g],
                        })
                      }
                      className={cn(
                        'rounded-full border px-2.5 py-1 text-xs font-medium transition-all',
                        on
                          ? 'border-accent-400 bg-accent-500/25 text-white'
                          : 'border-white/10 bg-ink-800 text-mist-400 hover:border-white/25 hover:text-mist-200',
                      )}
                    >
                      {g}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-mist-400">
                Release year — {filters.yearFrom} to {filters.yearTo}
              </p>
              <div className="space-y-3">
                <input
                  type="range"
                  min={1920}
                  max={2025}
                  value={filters.yearFrom}
                  onChange={(e) => update({ yearFrom: Math.min(Number(e.target.value), filters.yearTo) })}
                />
                <input
                  type="range"
                  min={1920}
                  max={2025}
                  value={filters.yearTo}
                  onChange={(e) => update({ yearTo: Math.max(Number(e.target.value), filters.yearFrom) })}
                />
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-mist-400">
                Minimum rating — {filters.minRating.toFixed(1)}
              </p>
              <input
                type="range"
                min={0}
                max={9}
                step={0.5}
                value={filters.minRating}
                onChange={(e) => update({ minRating: Number(e.target.value) })}
              />
              <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-wider text-mist-400">
                Minimum votes — {filters.minVotes.toLocaleString()}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {VOTE_OPTIONS.map((v) => (
                  <button
                    key={v}
                    onClick={() => update({ minVotes: v })}
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-xs font-medium transition-all',
                      filters.minVotes === v
                        ? 'border-accent-400 bg-accent-500/25 text-white'
                        : 'border-white/10 bg-ink-800 text-mist-400 hover:text-mist-200',
                    )}
                  >
                    {v === 0 ? 'Any' : v >= 1000 ? `${v / 1000}K+` : v}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-between gap-3">
              <p className="text-xs leading-relaxed text-mist-400">
                Filters sync to the URL — copy the address bar to share this exact view.
              </p>
              <button
                onClick={() => setSearchParams({})}
                className="inline-flex w-fit items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-sm text-mist-300 transition-colors hover:border-white/25 hover:text-white"
              >
                <X size={14} /> Reset all filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* results */}
      <div className="mt-6">
        {query.error && <ErrorState message={query.error} onRetry={query.retry} />}
        {query.loading && <GridSkeleton count={18} />}
        {!query.loading && !query.error && pageItems && pageItems.items.length === 0 && (
          <EmptyState
            icon={SlidersHorizontal}
            title="No movies match those filters"
            body="Try widening the year range, lowering the rating floor, or clearing a genre or two."
          />
        )}
        {!query.loading && !query.error && pageItems && pageItems.items.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 px-4 sm:grid-cols-3 md:px-8 lg:grid-cols-4 xl:grid-cols-6">
              {pageItems.items.map((m, i) => (
                <MovieCard key={m.tconst} movie={m} index={i} />
              ))}
            </div>

            {/* pagination */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-1.5">
              <button
                disabled={pageItems.page <= 1}
                onClick={() => update({ page: pageItems.page - 1 }, false)}
                className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-mist-300 transition-colors enabled:hover:border-accent-500/50 enabled:hover:text-white disabled:opacity-30"
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>
              {pageWindow.map((p, i) =>
                p === '…' ? (
                  <span key={`e${i}`} className="px-1 text-mist-400">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => update({ page: p }, false)}
                    className={cn(
                      'h-9 min-w-9 rounded-lg border px-2 text-sm font-medium transition-colors',
                      p === pageItems.page
                        ? 'border-accent-500/60 bg-accent-500/20 text-white'
                        : 'border-white/10 text-mist-300 hover:border-accent-500/40 hover:text-white',
                    )}
                  >
                    {p}
                  </button>
                ),
              )}
              <button
                disabled={pageItems.page >= pageItems.total_pages}
                onClick={() => update({ page: pageItems.page + 1 }, false)}
                className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-mist-300 transition-colors enabled:hover:border-accent-500/50 enabled:hover:text-white disabled:opacity-30"
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <p className="mt-3 text-center text-xs text-mist-400">
              Page {pageItems.page} of {pageItems.total_pages.toLocaleString()}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
