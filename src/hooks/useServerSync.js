import { useCallback, useEffect, useRef, useState } from 'react';
import { load, save } from '../utils/storage';
import { buildSyncPayload, loadSyncSettings, pushSnapshot, saveSyncSettings } from '../utils/sync';

const DEBOUNCE_MS = 3000;

/**
 * Keeps the shared database in step with this browser.
 *
 * When sync is enabled, any change to players, lineups, matches, rallies, events or
 * game plans schedules a push a few seconds later (changes made in quick succession
 * collapse into one). `syncNow` pushes immediately. Status survives reloads so the
 * Data page can always say when the last successful sync was.
 */
export function useServerSync(state) {
  const [settings, setSettings] = useState(loadSyncSettings);
  const [status, setStatus] = useState(() => ({
    state: 'idle', // idle | syncing | ok | error
    lastSyncAt: load('lastSyncAt', null),
    lastResult: load('lastSyncResult', null),
    error: null,
  }));
  const stateRef = useRef(state);
  stateRef.current = state;
  const inflight = useRef(false);
  const pending = useRef(false);
  const timer = useRef(null);

  const syncNow = useCallback(async () => {
    if (inflight.current) { pending.current = true; return; }
    inflight.current = true;
    setStatus(s => ({ ...s, state: 'syncing', error: null }));
    try {
      const result = await pushSnapshot(settings, buildSyncPayload(stateRef.current));
      const at = new Date().toISOString();
      save('lastSyncAt', at);
      save('lastSyncResult', result);
      setStatus({ state: 'ok', lastSyncAt: at, lastResult: result, error: null });
    } catch (e) {
      setStatus(s => ({ ...s, state: 'error', error: e.message }));
    } finally {
      inflight.current = false;
      if (pending.current) { pending.current = false; syncNow(); }
    }
  }, [settings]);

  const { players, lineups, matches, rallies, statEntries, nightPlans } = state;
  useEffect(() => {
    if (!settings.enabled || !settings.url || !settings.token) return undefined;
    clearTimeout(timer.current);
    timer.current = setTimeout(syncNow, DEBOUNCE_MS);
    return () => clearTimeout(timer.current);
  }, [settings.enabled, settings.url, settings.token, syncNow, players, lineups, matches, rallies, statEntries, nightPlans]);

  const updateSettings = useCallback((next) => {
    setSettings(next);
    saveSyncSettings(next);
  }, []);

  return { settings, updateSettings, status, syncNow };
}
