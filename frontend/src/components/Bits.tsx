import { AlertTriangle, RefreshCw } from 'lucide-react'
import { cn } from '../lib/utils'

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  action,
  className,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-5 flex flex-wrap items-end justify-between gap-3', className)}>
      <div>
        {eyebrow && (
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-accent-400">
            {eyebrow}
          </p>
        )}
        <h2 className="font-display text-2xl font-bold text-white md:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-mist-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string
  sub?: string
  accent?: boolean
}) {
  return (
    <div
      className={cn(
        'card-surface relative overflow-hidden p-5',
        accent && 'bg-gradient-to-br from-accent-600/25 to-flare-500/10',
      )}
    >
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-accent-500/10 blur-2xl" />
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mist-400">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-mist-400">{sub}</p>}
    </div>
  )
}

export function ChartCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('card-surface flex min-h-[320px] flex-col p-5', className)}>
      <div className="mb-4">
        <h3 className="font-display text-base font-bold text-white">{title}</h3>
        {subtitle && <p className="text-xs text-mist-400">{subtitle}</p>}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="card-surface mx-auto my-16 flex max-w-md flex-col items-center p-8 text-center">
      <AlertTriangle size={36} className="text-gold-400" />
      <h3 className="mt-4 font-display text-lg font-bold text-white">Something went wrong</h3>
      <p className="mt-2 text-sm text-mist-400">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent-500 px-4 py-2 text-sm font-semibold text-white transition-transform hover:scale-[1.03]"
        >
          <RefreshCw size={14} /> Try again
        </button>
      )}
    </div>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: React.ComponentType<{ size?: number | string; className?: string }>
  title: string
  body: string
  action?: React.ReactNode
}) {
  return (
    <div className="card-surface mx-auto my-16 flex max-w-md flex-col items-center p-10 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent-500/15 text-accent-300">
        <Icon size={26} />
      </span>
      <h3 className="mt-4 font-display text-lg font-bold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-mist-400">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div>
      <div className="skeleton aspect-[2/3] w-full" />
      <div className="skeleton mt-2.5 h-4 w-3/4" />
      <div className="skeleton mt-1.5 h-3 w-1/2" />
    </div>
  )
}

export function GridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 px-4 sm:grid-cols-3 md:px-8 lg:grid-cols-4 xl:grid-cols-6">
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}
