import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { api } from '../lib/api'
import type { Collection, Movie, Overview } from '../lib/types'
import { useApi } from '../hooks/useApi'
import Hero from '../components/Hero'
import MovieRow from '../components/MovieRow'
import { ErrorState, KpiCard } from '../components/Bits'

const COLLECTION_ROWS = ['top-rated', 'trending', 'hidden-gems', 'classics'] as const

function KpiStrip() {
  const { data, error, retry } = useApi<Overview>(() => api.overview(), [])
  if (error) return <ErrorState message={error} onRetry={retry} />
  if (!data) return null
  return (
    <div className="grid grid-cols-2 gap-4 px-4 py-8 md:grid-cols-4 md:px-8">
      <KpiCard label="Movies analyzed" value={data.total_movies.toLocaleString()} sub={`IMDb · ${data.year_min}–${data.year_max}`} accent />
      <KpiCard label="Average rating" value={data.avg_rating.toFixed(2)} sub={`${data.genre_count} genres tracked`} />
      <KpiCard label="Audience votes" value={`${(data.total_votes / 1e9).toFixed(2)}B`} sub="across all titles" />
      <KpiCard label="Avg runtime" value={`${Math.round(data.avg_runtime)} min`} sub="typical feature length" />
    </div>
  )
}

function CollectionRow({ slug }: { slug: string }) {
  const { data } = useApi<Collection>(() => api.collection(slug), [slug])
  if (!data) return null
  return <MovieRow title={data.label} movies={data.items} />
}

export default function Home() {
  const featured = useApi<Movie[]>(() => api.featured(), [])
  const overview = useApi<Overview>(() => api.overview(), [])

  if (featured.error) return <ErrorState message={featured.error} onRetry={featured.retry} />

  return (
    <div className="pb-10">
      <Hero movies={featured.data ?? []} />

      <div className="relative z-10 -mt-6">
        <KpiStrip />

        {featured.data && featured.data.length > 0 && (
          <MovieRow
            title="The Featured Collection"
            subtitle="30 landmark films with full production data"
            movies={featured.data}
          />
        )}

        {COLLECTION_ROWS.map((slug) => (
          <CollectionRow key={slug} slug={slug} />
        ))}

        {/* cross-link panel */}
        <div className="mx-4 mt-10 grid gap-4 md:mx-8 md:grid-cols-2">
          <Link
            to="/analytics"
            className="group card-surface relative overflow-hidden p-6 transition-all hover:border-accent-500/40"
          >
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent-500/15 blur-3xl" />
            <h3 className="font-display text-lg font-bold text-white">Explore the analytics →</h3>
            <p className="mt-1 text-sm text-mist-400">
              {overview.data
                ? `${overview.data.total_movies.toLocaleString()} movies · ratings, genres, decades, directors and more`
                : 'Ratings, genres, decades, directors and more'}
            </p>
          </Link>
          <Link
            to="/discover"
            className="group card-surface relative overflow-hidden p-6 transition-all hover:border-flare-500/40"
          >
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-flare-500/15 blur-3xl" />
            <h3 className="font-display text-lg font-bold text-white">
              <Compass size={18} className="mr-1.5 inline -translate-y-0.5" />
              Discover hidden gems →
            </h3>
            <p className="mt-1 text-sm text-mist-400">
              Full-text search, faceted filters and content-based recommendations
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}
