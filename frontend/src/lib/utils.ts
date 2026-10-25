/** Small helpers shared across the app. */

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

export function formatVotes(votes: number | null | undefined): string {
  if (!votes) return '—'
  if (votes >= 1_000_000) return `${(votes / 1_000_000).toFixed(1)}M`
  if (votes >= 1_000) return `${(votes / 1_000).toFixed(0)}K`
  return String(votes)
}

export function formatRevenue(musd: number | null | undefined): string {
  if (!musd) return '—'
  return musd >= 1000 ? `$${(musd / 1000).toFixed(2)}B` : `$${musd.toFixed(0)}M`
}

export function formatRuntime(runtime: number | null | undefined): string {
  if (!runtime) return '—'
  const h = Math.floor(runtime / 60)
  const m = runtime % 60
  return h ? `${h}h ${m ? `${m}m` : ''}`.trim() : `${m}m`
}

/** Deterministic gradient pair from any string — powers generated posters. */
const GRADIENTS: Array<[string, string]> = [
  ['#7c3aed', '#d946ef'],
  ['#0ea5e9', '#6366f1'],
  ['#f59e0b', '#ef4444'],
  ['#10b981', '#0ea5e9'],
  ['#f43f5e', '#a855f7'],
  ['#06b6d4', '#3b82f6'],
  ['#eab308', '#f97316'],
  ['#8b5cf6', '#3b82f6'],
]

export function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function gradientFor(seed: string): [string, string] {
  return GRADIENTS[hashString(seed) % GRADIENTS.length]
}
