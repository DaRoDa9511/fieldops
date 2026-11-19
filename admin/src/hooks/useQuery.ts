import { useCallback, useEffect, useState, type DependencyList } from 'react'

export type QueryStatus = 'loading' | 'success' | 'error'

export function errorMessage(e: unknown) {
  return e instanceof Error ? e.message : typeof e === 'string' ? e : 'Unexpected error'
}

/** Minimal loading/error/data hook with background reload (used by realtime refreshes). */
export function useQuery<T>(fetcher: () => Promise<T>, deps: DependencyList) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<QueryStatus>('loading')
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetcher()
      .then((d) => {
        if (cancelled) return
        setData(d)
        setError(null)
        setStatus('success')
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(errorMessage(e))
        setStatus('error')
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version])

  const reload = useCallback(() => setVersion((v) => v + 1), [])
  const retry = useCallback(() => {
    setStatus('loading')
    setVersion((v) => v + 1)
  }, [])

  return { data, error, status, reload, retry, setData }
}
