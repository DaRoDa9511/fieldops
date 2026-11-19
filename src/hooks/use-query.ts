import { useCallback, useEffect, useState, type DependencyList } from 'react';

export type QueryStatus = 'loading' | 'success' | 'error';

export function errorMessage(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e && typeof e.message === 'string') {
    if (/network|fetch/i.test(e.message)) return 'No connection. Check your internet and try again.';
    return e.message;
  }
  return 'Unexpected error';
}

/**
 * Tiny data-fetching hook (loading / error / data + pull-to-refresh), so every screen
 * handles the three states the same way without pulling in a full cache library.
 */
export function useQuery<T>(fetcher: () => Promise<T>, deps: DependencyList) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<QueryStatus>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetcher()
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setError(null);
        setStatus('success');
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(errorMessage(e));
        setStatus('error');
      })
      .finally(() => {
        if (!cancelled) setRefreshing(false);
      });
    return () => {
      cancelled = true;
    };
    // `fetcher` is recreated every render; the caller's `deps` decide when to refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);

  /** Background refetch (keeps current data visible, e.g. realtime or screen focus). */
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  /** Pull-to-refresh: shows the native spinner until the refetch finishes. */
  const refresh = useCallback(() => {
    setRefreshing(true);
    setVersion((v) => v + 1);
  }, []);

  /** After an error: go back to the loading skeleton and try again. */
  const retry = useCallback(() => {
    setStatus('loading');
    setVersion((v) => v + 1);
  }, []);

  return { data, error, status, refreshing, reload, refresh, retry, setData };
}
