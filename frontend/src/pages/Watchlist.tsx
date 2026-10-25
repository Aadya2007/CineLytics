import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { api } from '../lib/api'
import type { Movie, MovieDetail } from '../lib/types'
import { useApi } from '../hooks/useApi'
import { useWatchlist } from '../hooks/useWatchlist'
import MovieCard from '../components/MovieCard'
import { EmptyState, ErrorState, GridSkeleton, SectionHeader } from '../components/Bits'

/** Resolves every watchlisted tconst into a full movie object. */
function useWatchlistMovies(tconsts: string[]) {
  const key = tconsts.join(',')
  return useApi<Movie[]>(
    async () => {
      const results = await Promise.all(
        tconsts.map((t) => api.movie(t).catch(() => null)),
      )
      return results.filter((m): m is MovieDetail => m !== null)
    },
    [key],
  )
}

export default function Watchlist() {
  const { items } = useWatchlist()
  const query = useWatchlistMovies(items)

  return (
    <div className="mx-auto max-w-7xl px-4 pb-12 pt-6 md:px-8 md:pt-10">
      <SectionHeader
        eyebrow="Your library"
        title="Watchlist"
        subtitle={`${items.length} saved ${items.length === 1 ? 'title' : 'titles'} · stored locally in your browser`}
      />

      {items.length === 0 && (
        <EmptyState
          icon={Heart}
          title="Nothing saved yet"
          body="Tap the bookmark on any poster to build your personal watchlist. It lives in your browser — no account needed."
          action={
            <Link
              to="/discover"
              className="rounded-xl bg-gradient-to-r from-accent-500 to-flare-500 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-transform hover:scale-[1.03]"
            >
              Browse movies
            </Link>
          }
        />
      )}

      {items.length > 0 && query.error && (
        <ErrorState message={query.error} onRetry={query.retry} />
      )}
      {items.length > 0 && query.loading && <GridSkeleton count={6} />}
      {items.length > 0 && query.data && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {query.data.map((m, i) => (
            <MovieCard key={m.tconst} movie={m} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
