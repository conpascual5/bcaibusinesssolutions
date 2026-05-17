import { useState, useEffect, useRef } from 'react';

/**
 * A simple in-memory cache for Supabase queries.
 * Caches results by a unique key and auto-invalidates after a TTL.
 * This prevents redundant fetches when navigating between pages.
 */

const cache = new Map<string, { data: any; timestamp: number }>();
const DEFAULT_TTL = 30_000; // 30 seconds

export function clearCache() {
  cache.clear();
}

export function invalidateCache(keyPrefix: string) {
  for (const key of cache.keys()) {
    if (key.startsWith(keyPrefix)) {
      cache.delete(key);
    }
  }
}

export function useCachedQuery<T>(
  cacheKey: string | null,
  fetcher: () => Promise<T>,
  ttl: number = DEFAULT_TTL
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!cacheKey) return;

    let cancelled = false;
    const key: string = cacheKey;

    async function load() {
      const cached = cache.get(key);
      if (cached && Date.now() - cached.timestamp < ttl) {
        if (mountedRef.current && !cancelled) {
          setData(cached.data as T);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const result = await fetcher();
        cache.set(key, { data: result, timestamp: Date.now() });
        if (mountedRef.current && !cancelled) {
          setData(result);
          setLoading(false);
        }
      } catch (err) {
        if (mountedRef.current && !cancelled) {
          setError(err as Error);
          setLoading(false);
        }
      }
    }

    load();

    return () => { cancelled = true; };
  }, [cacheKey, ttl]);

  return { data, loading, error, refetch: () => { if (cacheKey) { cache.delete(cacheKey); } setLoading(true); fetcher().then(setData).finally(() => setLoading(false)); } };
}
