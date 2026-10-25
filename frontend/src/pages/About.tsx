import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Boxes,
  Database,
  Gauge,
  Radar,
  Server,
  Sparkles,
} from 'lucide-react'
import { useApi } from '../hooks/useApi'
import { api } from '../lib/api'
import type { Overview } from '../lib/types'
import { SectionHeader } from '../components/Bits'

const PIPELINE = [
  {
    icon: Database,
    title: '1 · Ingest',
    body: 'The official IMDb non-commercial datasets (title.basics, title.ratings, title.crew, name.basics — ~600 MB compressed) are streamed in chunks with pandas.',
  },
  {
    icon: Radar,
    title: '2 · Clean & join',
    body: 'Adult titles, shorts and records without a usable year/runtime/genre are dropped; ratings (≥ 100 votes) and director credits are joined; nconsts resolve to real names.',
  },
  {
    icon: Boxes,
    title: '3 · Model',
    body: 'A compact SQLite database is built with indexes on year/rating/votes plus an FTS5 full-text index over titles, directors and cast — 137k movies in ~34 MB.',
  },
  {
    icon: Server,
    title: '4 · Serve',
    body: 'A FastAPI service exposes faceted search, SQL analytics aggregations and a content-based recommendation engine, documented automatically via OpenAPI at /docs.',
  },
  {
    icon: Sparkles,
    title: '5 · Experience',
    body: 'A React 19 + TypeScript + Tailwind CSS 4 front-end with ECharts visualisations, Framer Motion transitions and a URL-synced filter state you can share.',
  },
]

const STACK = [
  ['Data pipeline', 'Python · pandas · IMDb datasets'],
  ['Storage', 'SQLite · FTS5 full-text search'],
  ['API', 'FastAPI · Uvicorn · OpenAPI docs'],
  ['Recommendations', 'content-based scoring (genre / rating / era / buzz)'],
  ['Front-end', 'React 19 · TypeScript · Tailwind CSS 4'],
  ['Charts', 'Apache ECharts · Framer Motion'],
  ['Artwork', 'TMDB API — lazy lookup by IMDb id, cached in SQLite'],
]

export default function About() {
  const overview = useApi<Overview>(() => api.overview(), [])

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 pt-6 md:px-8 md:pt-10">
      <SectionHeader
        eyebrow="How it's built"
        title="About Cinelytics"
        subtitle="From 600 MB of raw IMDb dumps to a live insights platform — a modern full-stack data product."
      />

      <div className="card-surface p-6 md:p-8">
        <p className="text-[15px] leading-relaxed text-mist-300">
          Cinelytics started as a small dashboard over a 60-row spreadsheet. Version 2 is a
          rebuild from first principles: it now analyses{' '}
          <b className="text-white">{overview.data?.total_movies.toLocaleString() ?? '—'} real
          theatrical movies</b> released between {overview.data?.year_min ?? '—'} and{' '}
          {overview.data?.year_max ?? '—'}, every one of them a genuine IMDb record with verified
          ratings, vote counts, runtimes, genres and named directors. Five curated collections,
          full-text search, shareable filters and a recommendation engine run on top of the same
          pipeline.
        </p>
      </div>

      {/* pipeline */}
      <div className="mt-10 space-y-3">
        {PIPELINE.map(({ icon: Icon, title, body }, i) => (
          <div
            key={title}
            className="card-surface group flex gap-4 p-5 transition-all hover:border-accent-500/40"
          >
            <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-gradient-to-br from-accent-500/25 to-flare-500/15 text-accent-300">
              <Icon size={20} />
            </span>
            <div>
              <h3 className="font-display text-base font-bold text-white">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-mist-400">{body}</p>
            </div>
            {i < PIPELINE.length - 1 && (
              <ArrowRight size={16} className="ml-auto hidden self-center text-ink-500 md:block" />
            )}
          </div>
        ))}
      </div>

      {/* stack table */}
      <div className="card-surface mt-10 overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {STACK.map(([k, v]) => (
              <tr key={k} className="border-b border-white/[0.05] last:border-0">
                <td className="w-44 px-5 py-3.5 font-semibold text-white">{k}</td>
                <td className="px-5 py-3.5 text-mist-300">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <div className="card-surface p-6">
          <h3 className="flex items-center gap-2 font-display text-base font-bold text-white">
            <Gauge size={17} className="text-accent-300" /> For the API curious
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-mist-400">
            The backend documents itself. While the server runs, open{' '}
            <code className="rounded bg-ink-800 px-1.5 py-0.5 text-xs text-accent-300">
              http://127.0.0.1:8001/docs
            </code>{' '}
            for the interactive OpenAPI playground — try{' '}
            <code className="rounded bg-ink-800 px-1.5 py-0.5 text-xs text-accent-300">
              /api/movies?search=nolan&min_rating=8
            </code>
            .
          </p>
        </div>
        <div className="card-surface p-6">
          <h3 className="flex items-center gap-2 font-display text-base font-bold text-white">
            <Sparkles size={17} className="text-flare-500" /> Start exploring
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-mist-400">
            Every filter state is a shareable URL. Try{' '}
            <Link className="text-accent-300 underline decoration-accent-500/40" to="/discover?genres=Film-Noir&rating=7.5">
              noir gems above 7.5
            </Link>{' '}
            or{' '}
            <Link className="text-accent-300 underline decoration-accent-500/40" to="/discover?votes=500000&sort=rating">
              the most-voted masterpieces
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
