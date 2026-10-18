import { useCallback, useSyncExternalStore } from 'react';

/**
 * Live `matchMedia` result. SSR-safe: `serverFallback` is used during pre-rendering and
 * hydration, then the real value takes over.
 */
export function useMediaQuery(query: string, serverFallback = false) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverFallback,
  );
}
