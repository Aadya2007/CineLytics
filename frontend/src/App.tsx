import { Suspense, lazy } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Route, Routes, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Discover from './pages/Discover'
import MovieDetailPage from './pages/MovieDetail'
import Watchlist from './pages/Watchlist'
import About from './pages/About'
import { WatchlistProvider } from './hooks/useWatchlist'

// ECharts is heavy — load the analytics page only when it's visited
const Analytics = lazy(() => import('./pages/Analytics'))

function NotFound() {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <div className="text-center">
        <p className="font-display text-7xl font-bold gradient-text">404</p>
        <p className="mt-3 text-mist-400">This reel doesn't exist.</p>
      </div>
    </div>
  )
}

export default function App() {
  const location = useLocation()
  return (
    <WatchlistProvider>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname.split('/')[1] || 'root'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <Routes location={location}>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/discover" element={<Discover />} />
              <Route
                path="/analytics"
                element={
                  <Suspense fallback={<div className="grid min-h-[60vh] place-items-center text-sm text-mist-400">Loading charts…</div>}>
                    <Analytics />
                  </Suspense>
                }
              />
              <Route path="/movie/:tconst" element={<MovieDetailPage />} />
              <Route path="/watchlist" element={<Watchlist />} />
              <Route path="/about" element={<About />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </motion.div>
      </AnimatePresence>
    </WatchlistProvider>
  )
}
