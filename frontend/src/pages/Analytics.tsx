import { api } from '../lib/api'
import type {
  DecadeStat,
  DirectorStat,
  GenreStat,
  HistogramBin,
  Overview,
  ScatterPoint,
  YearPoint,
} from '../lib/types'
import type { EChartsOption } from 'echarts'
import { useApi } from '../hooks/useApi'
import EChart from '../components/EChart'
import { ChartCard, ErrorState, KpiCard, SectionHeader } from '../components/Bits'
import { formatVotes } from '../lib/utils'

const AXIS = {
  axisLabel: { color: '#8f8fa8', fontSize: 11 },
  axisLine: { lineStyle: { color: '#292940' } },
  axisTick: { show: false },
  splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
}

function OverviewCards() {
  const { data, error, retry } = useApi<Overview>(() => api.overview(), [])
  if (error) return <ErrorState message={error} onRetry={retry} />
  if (!data) return null
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <KpiCard label="Movies" value={data.total_movies.toLocaleString()} sub={`${data.year_min}–${data.year_max}`} accent />
      <KpiCard label="Mean rating" value={data.avg_rating.toFixed(2)} sub={`${data.genre_count} genres`} />
      <KpiCard label="Total votes" value={`${(data.total_votes / 1e9).toFixed(2)}B`} sub="global audience" />
      <KpiCard
        label="Top rated"
        value={data.top_movie?.title ?? '—'}
        sub={data.top_movie ? `${data.top_movie.rating} · ${formatVotes(data.top_movie.votes)} votes` : ''}
      />
    </div>
  )
}

function TimelineChart() {
  const { data } = useApi<YearPoint[]>(() => api.timeline(), [])
  if (!data) return null
  const option: EChartsOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['Releases', 'Avg rating'], textStyle: { color: '#b6b6c9' }, top: 0 },
    grid: { left: 48, right: 48, top: 36, bottom: 28 },
    xAxis: { type: 'category', data: data.map((d) => d.year), ...AXIS },
    yAxis: [
      { type: 'value', name: 'releases', ...AXIS, nameTextStyle: { color: '#8f8fa8' } },
      { type: 'value', name: 'avg rating', min: 4, max: 8.5, ...AXIS, splitLine: { show: false }, nameTextStyle: { color: '#8f8fa8' } },
    ],
    dataZoom: [{ type: 'slider', height: 18, bottom: 6, borderColor: '#292940', backgroundColor: '#10101a', fillerColor: 'rgba(139,92,246,0.15)', handleStyle: { color: '#8b5cf6' }, textStyle: { color: '#8f8fa8' } }, { type: 'inside' }],
    series: [
      {
        name: 'Releases',
        type: 'bar',
        data: data.map((d) => d.count),
        itemStyle: { color: '#7c3aed', borderRadius: [3, 3, 0, 0], opacity: 0.85 },
        barMaxWidth: 14,
      },
      {
        name: 'Avg rating',
        type: 'line',
        yAxisIndex: 1,
        data: data.map((d) => d.avg_rating),
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#f5c518', width: 2.5 },
      },
    ],
  }
  return (
    <ChartCard
      title="A century of cinema"
      subtitle="Yearly release volume with average audience rating overlaid — drag to zoom"
      className="xl:col-span-2 xl:min-h-[380px]"
    >
      <EChart option={option} />
    </ChartCard>
  )
}

function RatingsChart() {
  const { data } = useApi<HistogramBin[]>(() => api.ratingsHistogram(), [])
  if (!data) return null
  const option: EChartsOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 12, top: 16, bottom: 26 },
    xAxis: { type: 'category', data: data.map((d) => d.label), ...AXIS },
    yAxis: { type: 'log', logBase: 10, ...AXIS },
    series: [
      {
        type: 'bar',
        data: data.map((d) => Math.max(d.count, 1)),
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#d946ef' },
              { offset: 1, color: '#7c3aed' },
            ],
          },
        },
        barCategoryGap: '18%',
      },
    ],
  }
  return (
    <ChartCard title="How movies are rated" subtitle="Distribution of IMDb ratings (log scale) — most films cluster near 6">
      <EChart option={option} />
    </ChartCard>
  )
}

function GenreChart() {
  const { data } = useApi<GenreStat[]>(() => api.genreStats(), [])
  if (!data) return null
  const top = data.slice(0, 12)
  const option: EChartsOption = {
    tooltip: {
      formatter: (params) => {
        const p = (Array.isArray(params) ? params[0] : params) as { name: string; value: number }
        const g = top.find((x) => x.genre === p.name)
        return `<b>${p.name}</b><br/>${p.value.toLocaleString()} movies<br/>avg rating ${g?.avg_rating ?? '—'}`
      },
    },
    series: [
      {
        type: 'pie',
        radius: ['46%', '72%'],
        center: ['50%', '52%'],
        data: top.map((g) => ({ name: g.genre, value: g.count })),
        label: { color: '#b6b6c9', fontSize: 11, formatter: '{b}' },
        itemStyle: { borderColor: '#10101a', borderWidth: 2, borderRadius: 6 },
        color: ['#a78bfa', '#d946ef', '#818cf8', '#f5c518', '#34d399', '#f472b6', '#38bdf8', '#fb923c', '#4ade80', '#e879f9', '#93c5fd', '#fca5a5'],
      },
    ],
  }
  return (
    <ChartCard title="Genre landscape" subtitle="Share of releases across the 12 biggest genres">
      <EChart option={option} />
    </ChartCard>
  )
}

function ScatterChart() {
  const { data } = useApi<ScatterPoint[]>(() => api.votesVsRating(), [])
  if (!data) return null
  const option: EChartsOption = {
    tooltip: {
      formatter: (params) => {
        const p = (Array.isArray(params) ? params[0] : params) as unknown as {
          value: [number, number, number]
        }
        return `rating ${p.value[0]}<br/>${formatVotes(p.value[1])} votes<br/>runtime ${p.value[2]} min`
      },
    },
    grid: { left: 52, right: 16, top: 16, bottom: 34 },
    xAxis: { type: 'value', name: 'rating', min: 1, max: 10, ...AXIS, nameTextStyle: { color: '#8f8fa8' } },
    yAxis: { type: 'log', logBase: 10, name: 'votes (log)', ...AXIS, nameTextStyle: { color: '#8f8fa8' } },
    series: [
      {
        type: 'scatter',
        data: data.map((d) => [d.rating, d.votes, d.runtime]),
        symbolSize: (v: number[]) => Math.max(3, Math.min(13, ((v[2] ?? 100) / 30) ** 1.15)),
        itemStyle: { color: '#8b5cf6', opacity: 0.55 },
        large: true,
        largeThreshold: 1200,
      },
    ],
  }
  return (
    <ChartCard
      title="Do popular movies rate higher?"
      subtitle="Each dot is a movie — rating vs votes (log), sized by runtime. The correlation is real but loose."
      className="xl:col-span-2 xl:min-h-[380px]"
    >
      <EChart option={option} />
    </ChartCard>
  )
}

function RuntimeChart() {
  const { data } = useApi<HistogramBin[]>(() => api.runtimeHistogram(), [])
  if (!data) return null
  const option: EChartsOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 12, top: 16, bottom: 26 },
    xAxis: { type: 'category', data: data.map((d) => d.label), ...AXIS },
    yAxis: { type: 'value', ...AXIS },
    series: [
      {
        type: 'bar',
        data: data.map((d) => d.count),
        itemStyle: { borderRadius: [4, 4, 0, 0], color: '#818cf8' },
        barCategoryGap: '22%',
      },
    ],
  }
  return (
    <ChartCard title="Feature length" subtitle="Runtime distribution — 90–110 minutes is the industry's comfort zone">
      <EChart option={option} />
    </ChartCard>
  )
}

function DecadeChart() {
  const { data } = useApi<DecadeStat[]>(() => api.decades(), [])
  if (!data) return null
  const option: EChartsOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 12, top: 16, bottom: 26 },
    xAxis: { type: 'category', data: data.map((d) => `${d.decade}s`), ...AXIS },
    yAxis: { type: 'value', min: 4, max: 8, ...AXIS },
    series: [
      {
        type: 'line',
        data: data.map((d) => d.avg_rating),
        smooth: true,
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: { color: '#34d399', width: 2.5 },
        itemStyle: { color: '#34d399' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(52,211,153,0.25)' },
              { offset: 1, color: 'rgba(52,211,153,0)' },
            ],
          },
        },
      },
    ],
  }
  return (
    <ChartCard title="Nostalgia premium" subtitle="Average rating by decade — older films consistently score higher">
      <EChart option={option} />
    </ChartCard>
  )
}

function DirectorsChart() {
  const { data } = useApi<DirectorStat[]>(() => api.topDirectors(), [])
  if (!data) return null
  const ordered = [...data].reverse()
  const option: EChartsOption = {
    tooltip: {
      formatter: (params) => {
        const p = (Array.isArray(params) ? params[0] : params) as { name: string; value: number }
        const d = data.find((x) => x.name === p.name)
        return `<b>${p.name}</b><br/>avg rating ${p.value}<br/>${d?.movies} qualifying films<br/>best: ${d?.best_title} (${d?.best_rating})`
      },
    },
    grid: { left: 150, right: 40, top: 10, bottom: 26 },
    xAxis: { type: 'value', min: 6.5, max: 8.6, ...AXIS },
    yAxis: { type: 'category', data: ordered.map((d) => d.name), ...AXIS, axisLabel: { color: '#dcdce6', fontSize: 11 } },
    series: [
      {
        type: 'bar',
        data: ordered.map((d) => d.avg_rating),
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          color: {
            type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#7c3aed' },
              { offset: 1, color: '#d946ef' },
            ],
          },
        },
        barCategoryGap: '32%',
        label: { show: true, position: 'right', color: '#f5c518', fontWeight: 700, fontSize: 11 },
      },
    ],
  }
  return (
    <ChartCard
      title="Masters of the craft"
      subtitle="Directors with 8+ widely-voted films, ranked by mean rating"
      className="xl:col-span-2 xl:min-h-[420px]"
    >
      <EChart option={option} />
    </ChartCard>
  )
}

export default function Analytics() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-12 pt-6 md:px-8 md:pt-10">
      <SectionHeader
        eyebrow="Community"
        title="Analytics"
        subtitle="Every chart is a live SQL aggregation over the full IMDb-derived dataset."
      />
      <div className="space-y-4">
        <OverviewCards />
        <div className="grid gap-4 xl:grid-cols-2">
          <TimelineChart />
          <RatingsChart />
          <GenreChart />
          <ScatterChart />
          <RuntimeChart />
          <DecadeChart />
          <DirectorsChart />
        </div>
      </div>
    </div>
  )
}
