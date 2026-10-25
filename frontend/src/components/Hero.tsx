import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Bookmark, Info, Play, Star } from 'lucide-react'
import type { Movie } from '../lib/types'
import { formatRuntime, formatVotes } from '../lib/utils'
import { useWatchlist } from '../hooks/useWatchlist'
import { Backdrop } from './Poster'

/** Auto-rotating cinematic hero for featured titles with real backdrops. */
export default function Hero({ movies }: { movies: Movie[] }) {
  const withBackdrop = movies.filter((m) => m.backdrop)
  const [index, setIndex] = useState(0)
  const { has, toggle } = useWatchlist()

  useEffect(() => {
    if (withBackdrop.length < 2) return
    const t = setInterval(() => setIndex((i) => (i + 1) % withBackdrop.length), 7000)
    return () => clearInterval(t)
  }, [withBackdrop.length])

  if (!withBackdrop.length) return null
  const movie = withBackdrop[index % withBackdrop.length]
  const saved = has(movie.tconst)

  return (
    <section className="relative h-[68vh] min-h-[440px] w-full overflow-hidden">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={movie.tconst}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
          className="absolute inset-0"
        >
          <Backdrop movie={movie} className="h-full w-full" />
        </motion.div>
      </AnimatePresence>

      {/* cinematic scrims */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/45 to-ink-950/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink-950/85 via-transparent to-transparent" />

      <div className="relative flex h-full items-end pb-14">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={movie.tconst + '-content'}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl px-4 md:px-8"
          >
            <div className="mb-3 flex items-center gap-2 text-sm">
              <span className="rounded-md bg-accent-500/90 px-2 py-0.5 text-[11px] font-bold uppercase tracking-widest text-white">
                Featured
              </span>
              {movie.rating && (
                <span className="inline-flex items-center gap-1 font-semibold text-gold-400">
                  <Star size={14} className="fill-current" /> {movie.rating.toFixed(1)}
                  {movie.votes && (
                    <span className="font-normal text-mist-400">
                      ({formatVotes(movie.votes)} votes)
                    </span>
                  )}
                </span>
              )}
            </div>

            <h1
              className="font-display text-4xl font-bold leading-tight text-white md:text-6xl"
              style={{ textShadow: '0 4px 30px rgba(0,0,0,0.55)' }}
            >
              {movie.title}
            </h1>

            <p className="mt-2 text-sm text-mist-300 md:text-base">
              {movie.year} · {formatRuntime(movie.runtime)} · {movie.genres.join(' / ')}
              {movie.director && ` · Directed by ${movie.director.split(', ')[0]}`}
            </p>
            {movie.overview && (
              <p className="mt-4 line-clamp-3 max-w-xl text-sm leading-relaxed text-mist-300/90 md:text-[15px]">
                {movie.overview}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                to={`/movie/${movie.tconst}`}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent-500 to-flare-500 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-transform hover:scale-[1.03]"
              >
                <Play size={16} className="fill-current" /> Explore insights
              </Link>
              <button
                onClick={() => toggle(movie.tconst)}
                className={`inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold backdrop-blur-md transition-colors ${
                  saved
                    ? 'border-accent-400/60 bg-accent-500/20 text-accent-300'
                    : 'border-white/20 bg-white/5 text-white hover:bg-white/10'
                }`}
              >
                <Bookmark size={16} className={saved ? 'fill-current' : ''} />
                {saved ? 'In watchlist' : 'Add to watchlist'}
              </button>
              <span className="hidden items-center gap-1.5 text-xs text-mist-400 md:inline-flex">
                <Info size={13} /> Data: official IMDb datasets
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* rotation indicators */}
      <div className="absolute bottom-5 right-6 flex gap-1.5">
        {withBackdrop.slice(0, 6).map((m, i) => (
          <button
            key={m.tconst}
            aria-label={`Show ${m.title}`}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === index % withBackdrop.length ? 'w-6 bg-accent-400' : 'w-1.5 bg-white/30'
            }`}
          />
        ))}
      </div>
    </section>
  )
}
