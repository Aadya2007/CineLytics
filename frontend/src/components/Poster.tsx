import { useState } from 'react'
import { Clapperboard } from 'lucide-react'
import type { Movie } from '../lib/types'
import { cn, gradientFor } from '../lib/utils'

const RATIO = 'aspect-[2/3]'

/**
 * Movie poster. Real TMDB artwork for featured titles; for everything else a
 * deterministic "typographic poster" — gradient + display typography derived
 * from the title, so the grid still looks intentional at 137k scale.
 */
export default function Poster({
  movie,
  className,
}: {
  movie: Pick<Movie, 'tconst' | 'title' | 'poster' | 'genres' | 'year' | 'director'>
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const showImage = movie.poster && !failed

  if (showImage) {
    return (
      <div className={cn(RATIO, 'relative overflow-hidden bg-ink-800', className)}>
        <img
          src={movie.poster!}
          alt={movie.title}
          loading="lazy"
          onError={() => setFailed(true)}
          onLoad={(e) => e.currentTarget.classList.add('opacity-100')}
          className="h-full w-full object-cover opacity-0 transition-opacity duration-500"
        />
      </div>
    )
  }

  const [from, to] = gradientFor(movie.tconst)
  const initials = movie.title
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 3)
    .map((w) => w[0]!.toUpperCase())
    .join('')

  return (
    <div
      className={cn(RATIO, 'relative flex flex-col justify-between overflow-hidden p-3', className)}
      style={{ background: `linear-gradient(145deg, ${from}, ${to})` }}
    >
      {/* subtle diagonal texture */}
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(115deg, transparent 0px, transparent 10px, rgba(0,0,0,0.7) 10px, rgba(0,0,0,0.7) 11px)',
        }}
      />
      <div className="relative flex items-center justify-between">
        <Clapperboard size={16} className="text-white/70" />
        <span className="font-display text-sm font-semibold tracking-widest text-white/80">
          {initials || 'CINE'}
        </span>
      </div>
      <div className="relative">
        <h4
          className="font-display font-bold leading-tight text-white line-clamp-3"
          style={{ textShadow: '0 2px 12px rgba(0,0,0,0.45)' }}
        >
          {movie.title}
        </h4>
        <p className="mt-1 text-[11px] font-medium text-white/75">
          {movie.year}
          {movie.director ? ` · ${movie.director.split(', ')[0]}` : ''}
        </p>
      </div>
    </div>
  )
}

/** Convenience: pick a wide backdrop image or gradient for hero surfaces. */
export function Backdrop({ movie, className }: { movie: Movie; className?: string }) {
  const [failed, setFailed] = useState(false)
  const [from, to] = gradientFor(movie.tconst)

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{ background: `linear-gradient(120deg, ${from}, ${to})` }}
    >
      {movie.backdrop && !failed && (
        <img
          src={movie.backdrop}
          alt=""
          onError={() => setFailed(true)}
          onLoad={(e) => e.currentTarget.classList.add('opacity-100')}
          className="relative h-full w-full object-cover opacity-0 transition-opacity duration-700"
        />
      )}
    </div>
  )
}
