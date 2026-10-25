import { useCallback, useEffect, useRef, useState } from 'react'

interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
  retry: () => void
}

/** Minimal async-data hook with loading / error / retry. */
export function useApi<T>(fn: () => Promise<T>, deps: unknown[]): ApiState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const fnRef = useRef(fn)
  fnRef.current = fn
  const retry = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    fnRef
      .current()
      .then((d) => {
        if (alive) {
          setData(d)
          setLoading(false)
        }
      })
      .catch((e: unknown) => {
        if (alive) {
          setError(e instanceof Error ? e.message : 'Request failed')
          setLoading(false)
        }
      })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  return { data, loading, error, retry }
}
