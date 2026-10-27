import { describe, expect, it, vi } from 'vitest';
import { buildSyncPayload, normalizeApiUrl, pushSnapshot, summarizeSync } from '../utils/sync';
import { buildDemoSeason } from '../data/demoSeason';
import { DEFAULT_PLAYERS, DEFAULT_LINEUP, DEFAULT_LINEUP_GROW, DEFAULT_LINEUP_FLOW } from '../data/defaults';

const LINEUPS = [DEFAULT_LINEUP, DEFAULT_LINEUP_GROW, DEFAULT_LINEUP_FLOW];
const season = buildDemoSeason(DEFAULT_PLAYERS, LINEUPS);
const state = {
  players: DEFAULT_PLAYERS,
  lineups: LINEUPS,
  matches: season.matches,
  rallies: season.rallies,
  statEntries: season.statEntries,
  nightPlans: [],
  experimentNotes: [],
  activeLineupId: 'lineup-1',
  activeFormationId: 'sr-5-1',
};

const okResponse = (body, status = 200) => ({ ok: status < 400, status, text: async () => JSON.stringify(body) });

describe('server sync', () => {
  it('sends the export format plus a client id', () => {
    const payload = buildSyncPayload(state, 'browser-1');
    expect(payload.clientId).toBe('browser-1');
    expect(payload.version).toBe(2);
    expect(payload.players).toBe(DEFAULT_PLAYERS);
    expect(payload.rallies).toHaveLength(season.rallies.length);
    expect(payload.statEntries).toHaveLength(season.statEntries.length);
    expect(typeof payload.appVersion).toBe('string');
  });

  it('posts to /v1/sync with a bearer token and returns the summary', async () => {
    const fetchImpl = vi.fn(async () => okResponse({ batchId: 'b1', changes: {} }));
    const result = await pushSnapshot({ url: 'https://api.example.com/', token: 't0k' }, { clientId: 'x' }, fetchImpl);
    expect(result.batchId).toBe('b1');
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://api.example.com/v1/sync');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer t0k');
    expect(JSON.parse(init.body)).toEqual({ clientId: 'x' });
  });

  it('turns server errors into readable messages', async () => {
    await expect(pushSnapshot({ url: 'https://a', token: 't' }, {}, async () => okResponse({ detail: 'Invalid or missing bearer token' }, 401)))
      .rejects.toThrow('Invalid or missing bearer token');
    await expect(pushSnapshot({ url: 'https://a', token: 't' }, {}, async () => okResponse(null, 503)))
      .rejects.toThrow('HTTP 503');
    await expect(pushSnapshot({ url: 'https://a', token: 't' }, {}, async () => { throw new TypeError('Failed to fetch'); }))
      .rejects.toThrow('Could not reach the server');
    await expect(pushSnapshot({ url: '', token: 't' }, {})).rejects.toThrow('Server URL is not set');
    await expect(pushSnapshot({ url: 'https://a', token: '' }, {})).rejects.toThrow('Sync token is not set');
  });

  it('normalises the server url', () => {
    expect(normalizeApiUrl(' https://a.example.com// ')).toBe('https://a.example.com');
    expect(normalizeApiUrl(undefined)).toBe('');
  });

  it('summarises what the server did', () => {
    expect(summarizeSync({
      counts: { statEntries: 4000 },
      changes: { players: { inserted: 9, updated: 0, deleted: 0 }, stat_events: { inserted: 0, updated: 12, deleted: 3 } },
      rejected: [{ table: 'stat_events', id: 'x', reason: 'unknown player' }],
    })).toBe('4,000 events sent · 9 added · 12 updated · 3 removed · 1 rejected');
    expect(summarizeSync({ counts: { statEntries: 10 }, changes: {}, rejected: [] })).toBe('10 events sent · nothing changed');
    expect(summarizeSync(null)).toBe('');
  });
});
