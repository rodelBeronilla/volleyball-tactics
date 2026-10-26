import { useSyncExternalStore } from 'react';

/** Live result of a CSS media query, e.g. useMediaQuery('(min-width: 1024px)') */
export function useMediaQuery(query) {
  return useSyncExternalStore(
    cb => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', cb);
      return () => mql.removeEventListener('change', cb);
    },
    () => window.matchMedia(query).matches,
  );
}

/** Matches Tailwind's `lg` breakpoint, where the sidebar layout starts */
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');
