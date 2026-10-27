/**
 * Server sync: push this browser's whole dataset to the shared database.
 *
 * The payload is the same JSON as Team → Data → Export, plus a stable client id
 * for this browser, sent to POST {url}/v1/sync with a bearer token. The server
 * upserts what changed, soft-deletes what this client removed, and reports rows
 * it could not store. See platform/api in the repo.
 */
import { load, save } from './storage';
import { exportAllData } from './storageManager';

export const DEFAULT_SYNC_SETTINGS = {
  url: import.meta.env.VITE_API_URL || '',
  token: '',
  enabled: false,
};

export function loadSyncSettings() {
  return { ...DEFAULT_SYNC_SETTINGS, ...load('sync', {}) };
}

export function saveSyncSettings(settings) {
  save('sync', settings);
}

/** A random id that identifies this browser to the server, created once. */
export function getClientId() {
  let id = load('clientId', null);
  if (!id) {
    id = globalThis.crypto?.randomUUID
      ? globalThis.crypto.randomUUID()
      : `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    save('clientId', id);
  }
  return id;
}

export function normalizeApiUrl(url) {
  return String(url || '').trim().replace(/\/+$/, '');
}

export function buildSyncPayload(state, clientId = getClientId()) {
  return {
    ...exportAllData(state),
    clientId,
    appVersion: import.meta.env.APP_VERSION || 'dev',
  };
}

/**
 * POST the snapshot. Resolves with the server's summary, rejects with a readable error.
 * @param {{url: string, token: string}} settings
 * @param {object} payload
 * @param {typeof fetch} [fetchImpl]
 */
export async function pushSnapshot(settings, payload, fetchImpl = globalThis.fetch) {
  const base = normalizeApiUrl(settings.url);
  if (!base) throw new Error('Server URL is not set.');
  if (!settings.token) throw new Error('Sync token is not set.');
  let res;
  try {
    res = await fetchImpl(`${base}/v1/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${settings.token}` },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('Could not reach the server. Check the URL and your connection.');
  }
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = null; }
  if (!res.ok) {
    const detail = body?.detail;
    const message = typeof detail === 'string' ? detail : res.status === 401 ? 'The server rejected the sync token.' : `Server error (HTTP ${res.status}).`;
    throw new Error(message);
  }
  return body;
}

const fmt = n => Number(n || 0).toLocaleString();

/** One line a coach can read: what the server did with the last snapshot. */
export function summarizeSync(result) {
  if (!result) return '';
  const changes = Object.values(result.changes || {}).reduce(
    (acc, c) => ({ inserted: acc.inserted + (c.inserted || 0), updated: acc.updated + (c.updated || 0), deleted: acc.deleted + (c.deleted || 0) }),
    { inserted: 0, updated: 0, deleted: 0 },
  );
  const parts = [];
  if (changes.inserted) parts.push(`${fmt(changes.inserted)} added`);
  if (changes.updated) parts.push(`${fmt(changes.updated)} updated`);
  if (changes.deleted) parts.push(`${fmt(changes.deleted)} removed`);
  if (!parts.length) parts.push('nothing changed');
  const rejected = (result.rejected || []).length;
  if (rejected) parts.push(`${fmt(rejected)} rejected`);
  return `${fmt(result.counts?.statEntries)} events sent · ${parts.join(' · ')}`;
}
