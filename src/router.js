/**
 * Minimal hash router: routes look like #/analytics/players/p3.
 * Hash routing keeps every page linkable on GitHub Pages without server rewrites.
 */
import { useSyncExternalStore } from 'react';

function subscribe(callback) {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
}

const getPath = () => window.location.hash.replace(/^#/, '') || '/';

/** Current route as path segments, e.g. ['analytics', 'players', 'p3'] */
export function useRoute() {
  const path = useSyncExternalStore(subscribe, getPath);
  return path.split('/').filter(Boolean);
}

/** Go to a route ('/analytics/players'). `replace` skips a history entry. */
export function navigate(path, { replace = false } = {}) {
  const hash = '#' + path;
  if (window.location.hash === hash) return;
  if (replace) {
    window.history.replaceState(null, '', hash);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    window.location.hash = path;
  }
}

/** href for an <a> tag */
export const href = path => '#' + path;
