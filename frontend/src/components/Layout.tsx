import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BarChart3, Clapperboard, Compass, Heart, Home, Info, Search } from 'lucide-react'
import { cn } from '../lib/utils'
import { useWatchlist } from '../hooks/useWatchlist'

const NAV = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/discover', label: 'Discover', icon: Compass },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/watchlist', label: 'Watchlist', icon: Heart },
  { to: '/about', label: 'About', icon: Info },
]

function GlobalSearch() {
  const navigate = useNavigate()
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const q = new FormData(e.currentTarget).get('q') as string
        if (q.trim()) navigate(`/discover?q=${encodeURIComponent(q.trim())}`)
      }}
      className="relative w-full max-w-md"
    >
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-mist-400" />
      <input
        name="q"
        placeholder="Search 137,000+ movies, directors, cast…"
        className="w-full rounded-xl border border-white/10 bg-ink-850/80 py-2 pl-9 pr-3 text-sm text-mist-200 placeholder:text-mist-400/70 outline-none transition-colors focus:border-accent-500/60 focus:bg-ink-800"
      />
    </form>
  )
}

export default function Layout() {
  const { pathname } = useLocation()
  const { count } = useWatchlist()

  useEffect(() => {
    window.scrollTo({ top: 0 })
    const page = pathname === '/' ? 'Home' : (pathname.split('/')[1] ?? '')
    document.title = page
      ? `Cinelytics — ${page.charAt(0).toUpperCase() + page.slice(1)}`
      : 'Cinelytics — Movie Insights Platform'
  }, [pathname])

  return (
    <div className="flex min-h-screen">
      {/* ——— desktop sidebar ——— */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-white/[0.06] bg-ink-900/70 backdrop-blur-xl lg:flex">
        <Link to="/" className="flex items-center gap-2.5 px-6 pb-6 pt-7">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-accent-500 to-flare-500 shadow-glow">
            <Clapperboard size={18} className="text-white" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight text-white">
            Cine<span className="gradient-text">lytics</span>
          </span>
        </Link>

        <nav className="flex-1 space-y-1 px-3">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-gradient-to-r from-accent-500/20 to-flare-500/10 text-white shadow-[inset_0_0_0_1px_rgb(139_92_246/0.25)]'
                    : 'text-mist-400 hover:bg-white/[0.04] hover:text-mist-200',
                )
              }
            >
              <Icon size={17} />
              {label}
              {label === 'Watchlist' && count > 0 && (
                <span className="ml-auto rounded-full bg-accent-500 px-2 py-0.5 text-[10px] font-bold text-white">
                  {count}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/[0.06] px-6 py-5">
          <p className="text-[11px] leading-relaxed text-mist-400">
            Built on official IMDb datasets · FastAPI + React
          </p>
          <a
            href="https://github.com/Aadya2007/Cinelytics"
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-[11px] font-medium text-accent-300 hover:text-accent-400"
          >
            github.com/Aadya2007 ↗
          </a>
        </div>
      </aside>

      {/* ——— mobile top bar ——— */}
      <div className="sticky top-0 z-40 flex w-full items-center gap-3 border-b border-white/[0.06] bg-ink-900/80 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-accent-500 to-flare-500">
            <Clapperboard size={15} className="text-white" />
          </span>
          <span className="font-display text-lg font-bold text-white">
            Cine<span className="gradient-text">lytics</span>
          </span>
        </Link>
      </div>

      {/* ——— main column ——— */}
      <div className="min-w-0 flex-1 overflow-x-clip lg:pl-60">
        <div className="sticky top-0 z-30 hidden border-b border-white/[0.06] bg-ink-950/70 px-8 py-3 backdrop-blur-xl lg:block">
          <div className="flex items-center justify-end">
            <GlobalSearch />
          </div>
        </div>

        <Outlet />
      </div>

      {/* ——— mobile bottom nav ——— */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-white/[0.08] bg-ink-900/90 py-2 backdrop-blur-xl lg:hidden">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium transition-colors',
                isActive ? 'text-accent-300' : 'text-mist-400',
              )
            }
          >
            <Icon size={19} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="h-16 lg:hidden" />
    </div>
  )
}
