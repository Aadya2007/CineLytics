import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Movie } from '../lib/types'
import MovieCard from './MovieCard'

/** Horizontally scrolling card row with edge arrows (Netflix-style). */
export default function MovieRow({
  title,
  subtitle,
  movies,
  action,
}: {
  title: string
  subtitle?: string
  movies: Movie[]
  action?: React.ReactNode
}) {
  const scroller = useRef<HTMLDivElement>(null)

  const scroll = (dir: 1 | -1) => {
    const el = scroller.current
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' })
  }

  if (!movies.length) return null

  return (
    <section className="group/row relative">
      <div className="mb-3 flex items-end justify-between px-4 md:px-8">
        <div>
          <h2 className="font-display text-lg font-bold text-mist-200 md:text-xl">{title}</h2>
          {subtitle && <p className="text-xs text-mist-400">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {action}
          <div className="hidden gap-1 md:flex">
            <button
              aria-label="Scroll left"
              onClick={() => scroll(-1)}
              className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-ink-800 text-mist-300 transition-colors hover:border-accent-500/50 hover:text-white"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              aria-label="Scroll right"
              onClick={() => scroll(1)}
              className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-ink-800 text-mist-300 transition-colors hover:border-accent-500/50 hover:text-white"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={scroller}
        className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-2 md:px-8"
      >
        {movies.map((m) => (
          <div key={m.tconst} className="w-36 flex-none snap-start md:w-40 lg:w-44">
            <MovieCard movie={m} />
          </div>
        ))}
      </div>
    </section>
  )
}
