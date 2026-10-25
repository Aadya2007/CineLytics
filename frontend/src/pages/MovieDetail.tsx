import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Bookmark, Clapperboard, DollarSign, Star, Users } from 'lucide-react'
import { api } from '../lib/api'
import type { Movie, MovieDetail } from '../lib/types'
import { formatRuntime, formatVotes } from '../lib/utils'
import { useApi } from '../hooks/useApi'
import { useWatchlist } from '../hooks/useWatchlist'
import Poster, { Backdrop } from '../components/Poster'
import MovieRow from '../components/MovieRow'
import { ErrorState, GridSkeleton } from '../components/Bits'

function RatingRing({ rating }: { rating: number }) {
  const pct = (rating / 10) * 100
  return (
    <div
      className="grid h-16 w-16 place-items-center rounded-full"
      style={{
        background: `conic-gradient(#f5c518 ${pct}%, rgba(255,255,255,0.1) ${pct}%)`,
      }}
    >
      <div className="grid h-[52px] w-[52px] place-items-center rounded-full bg-ink-900">
        <span className="font-display text-base font-bold text-white">{rating.toFixed(1)}</span>
      </div>
    </div>
  )
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ size?: number | string; className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-mist-400">
        <Icon size={12} /> {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-white">{value}</p>
    </div>
  )
}

export default function MovieDetailPage() {
  const { tconst = '' } = useParams()
  const movie = useApi<MovieDetail>(() => api.movie(tconst), [tconst])
  const similar = useApi<Movie[]>(() => api.similar(tconst), [tconst])
  const { has, toggle } = useWatchlist()

  if (movie.loading) {
    return (
      <div className="pt-10">
        <div className="skeleton mx-4 h-72 rounded-3xl md:mx-8" />
        <div className="mt-8">
          <GridSkeleton count={6} />
        </div>
      </div>
    )
  }
  if (movie.error || !movie.data)
    return (
      <div className="pt-10">
        <ErrorState message={movie.error ?? 'Movie not found'} onRetry={movie.retry} />
      </div>
    )

  const m = movie.data
  const saved = has(m.tconst)

  return (
    <div className="pb-12">
      {/* ——— backdrop banner ——— */}
      <div className="relative h-[42vh] min-h-[320px] w-full overflow-hidden">
        <Backdrop movie={m} className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-ink-950/20" />
        <Link
          to="/discover"
          className="absolute left-4 top-5 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-black/40 px-3.5 py-2 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-black/60 md:left-8"
        >
          <ArrowLeft size={15} /> Discover
        </Link>
      </div>

      <div className="relative -mt-32 px-4 md:px-8">
        <div className="flex flex-col gap-6 md:flex-row">
          <div className="w-40 flex-none md:w-52">
            <Poster movie={m} className="rounded-2xl border border-white/10 shadow-card" />
          </div>

          <div className="min-w-0 flex-1 md:pt-16">
            <div className="flex flex-wrap items-center gap-2">
              {m.featured && (
                <span className="rounded-md bg-accent-500/90 px-2 py-0.5 text-[11px] font-bold uppercase tracking-widest text-white">
                  Featured
                </span>
              )}
              {m.certificate && (
                <span className="rounded-md border border-white/20 px-2 py-0.5 text-xs font-semibold text-mist-300">
                  {m.certificate}
                </span>
              )}
              {m.rating && (
                <span className="inline-flex items-center gap-1 text-sm font-bold text-gold-400">
                  <Star size={15} className="fill-current" />
                  {m.rating.toFixed(1)}
                  <span className="font-normal text-mist-400">
                    ({formatVotes(m.votes)} votes)
                  </span>
                </span>
              )}
            </div>

            <h1 className="mt-2 font-display text-3xl font-bold leading-tight text-white md:text-5xl">
              {m.title}
            </h1>
            <p className="mt-2 text-sm text-mist-400 md:text-base">
              {m.year} · {formatRuntime(m.runtime)} · {m.genres.join(' / ')}
            </p>
            {m.original_title && m.original_title !== m.title && (
              <p className="mt-1 text-sm text-mist-400">Original title: {m.original_title}</p>
            )}

            {m.overview && (
              <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-mist-300">{m.overview}</p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => toggle(m.tconst)}
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
                  saved
                    ? 'bg-accent-500 text-white shadow-glow'
                    : 'border border-white/15 bg-white/5 text-white hover:bg-white/10'
                }`}
              >
                <Bookmark size={16} className={saved ? 'fill-current' : ''} />
                {saved ? 'In watchlist' : 'Add to watchlist'}
              </button>
              {m.rating && (
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2">
                  <RatingRing rating={m.rating} />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-mist-400">
                      IMDb rating
                    </p>
                    <p className="text-xs text-mist-300">{formatVotes(m.votes)} audience votes</p>
                  </div>
                </div>
              )}
            </div>

            {/* metadata grid */}
            <div className="mt-7 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <Stat icon={Clapperboard} label="Director" value={m.director ?? '—'} />
              <Stat icon={Star} label="Top genre" value={m.genres[0] ?? '—'} />
              <Stat icon={DollarSign} label="Box office" value={m.revenue_musd ? `$${m.revenue_musd.toFixed(0)}M` : '—'} />
              <Stat icon={Users} label="Decade" value={m.decade ? `${m.decade}s` : '—'} />
            </div>

            {m.cast.length > 0 && (
              <div className="mt-6 max-w-3xl">
                <p className="text-[11px] font-bold uppercase tracking-wider text-mist-400">Top billed cast</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {m.cast.map((c) => (
                    <span key={c} className="rounded-full border border-white/10 bg-ink-800 px-3 py-1.5 text-xs font-medium text-mist-200">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-12">
        {similar.data && similar.data.length > 0 && (
          <MovieRow
            title="More like this"
            subtitle="Content-based recommendations — genre overlap, rating proximity, era and buzz"
            movies={similar.data}
          />
        )}
      </div>
    </div>
  )
}
