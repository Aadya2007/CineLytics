import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const KEY = 'cinelytics.watchlist'

function read(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

interface WatchlistContextValue {
  items: string[]
  toggle: (tconst: string) => void
  has: (tconst: string) => boolean
  count: number
}

const WatchlistContext = createContext<WatchlistContextValue>({
  items: [],
  toggle: () => {},
  has: () => false,
  count: 0,
})

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<string[]>(read)

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items))
  }, [items])

  const toggle = useCallback((tconst: string) => {
    setItems((prev) =>
      prev.includes(tconst) ? prev.filter((x) => x !== tconst) : [tconst, ...prev],
    )
  }, [])

  const has = useCallback((tconst: string) => items.includes(tconst), [items])

  return (
    <WatchlistContext.Provider value={{ items, toggle, has, count: items.length }}>
      {children}
    </WatchlistContext.Provider>
  )
}

export const useWatchlist = () => useContext(WatchlistContext)
