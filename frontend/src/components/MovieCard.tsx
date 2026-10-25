import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bookmark, Star } from 'lucide-react'
import type { Movie } from '../lib/types'
import { cn, formatVotes } from '../lib/utils'
import { useWatchlist } from '../hooks/useWatchlist'
import Poster from './Poster'

export function RatingBadge({ rating, className }: { rating: number | null; className?: string }) {
  if (!rating) return null
  const tone =
    rating >= 8 ? 'bg-gold-400 text-ink-950' : rating >= 6.5 ? 'bg-white/15 text-white' : 'bg-black/55 text-white/90'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-bold backdrop-blur-sm',
        tone,
        className,
      )}
    >
      <Star size={11} className="fill-current" />
      {rating.toFixed(1)}
    </span>
  )
}

export function WatchlistButton({ movie, className }: { movie: Movie; className?: string }) {
  const { has, toggle } = useWatchlist()
  const saved = has(movie.tconst)
  return (
    <button
      aria-label={saved ? 'Remove from watchlist' : 'Add to watchlist'}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggle(movie.tconst)
      }}
      className={cn(
        'grid h-8 w-8 place-items-center rounded-full border border-white/15 backdrop-blur-md transition-all',
        saved
          ? 'bg-accent-500 text-white shadow-glow'
          : 'bg-black/40 text-white/80 opacity-0 group-hover:opacity-100 hover:bg-black/60',
        className,
      )}
    >
      <Bookmark size={14} className={saved ? 'fill-current' : ''} />
    </button>
  )
}

export default function MovieCard({ movie, index = 0 }: { movie: Movie; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.4), ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        to={`/movie/${movie.tconst}`}
        className="group relative block"
        title={movie.title}
      >
        <div className="overflow-hidden rounded-xl border border-white/[0.06] shadow-card transition-all duration-300 group-hover:-translate-y-1 group-hover:border-accent-500/40 group-hover:shadow-glow">
          <Poster movie={movie} />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 rounded-b-xl bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>

        <div className="absolute left-2 top-2">
          {movie.featured && (
            <span className="mr-1 rounded-md bg-accent-500/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              Featured
            </span>
          )}
        </div>
        <div className="absolute right-2 top-2 flex gap-1">
          <WatchlistButton movie={movie} />
        </div>
        <div className="absolute bottom-2 right-2">
          <RatingBadge rating={movie.rating} />
        </div>

        <div className="mt-2.5 px-0.5">
          <h3 className="truncate text-sm font-semibold text-mist-200 transition-colors group-hover:text-white">
            {movie.title}
          </h3>
          <p className="mt-0.5 truncate text-xs text-mist-400">
            {movie.year} · {movie.genres.slice(0, 2).join(' / ')}
            {movie.votes ? ` · ${formatVotes(movie.votes)} votes` : ''}
          </p>
        </div>
      </Link>
    </motion.div>
  )
}
