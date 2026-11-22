/**
 * Build the demo-season sync payload used by the platform tests.
 *
 * The app's simulator (src/data/demoSeason.js) is the only source of the
 * fixture, so the payload always has exactly the shape the web app sends to
 * POST /v1/sync. Run from the repo root (needs the app's node_modules):
 *
 *   node platform/fixtures/build-demo-fixture.mjs
 *
 * Writes platform/fixtures/demo_season_sync.json.gz. Deterministic: the
 * simulator is seeded and timestamps are pinned.
 */
import { gzipSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createServer, createServerModuleRunner } from 'vite';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = process.argv[2] || path.join(here, 'demo_season_sync.json.gz');
const PINNED = '2026-09-01T12:00:00.000Z';

const server = await createServer({
  configFile: false,
  root: path.resolve(here, '..', '..'),
  server: { middlewareMode: true, hmr: false, watch: null },
  appType: 'custom',
  logLevel: 'error',
});

try {
  const runner = createServerModuleRunner(server.environments.ssr);
  const demo = await runner.import('/src/data/demoSeason.js');
  const defaults = await runner.import('/src/data/defaults.js');

  const pin = l => ({ ...l, createdAt: PINNED, updatedAt: PINNED });
  const lineups = [defaults.DEFAULT_LINEUP, defaults.DEFAULT_LINEUP_GROW, defaults.DEFAULT_LINEUP_FLOW].map(pin);
  const season = demo.buildDemoSeason(defaults.DEFAULT_PLAYERS, lineups);

  const payload = {
    version: 2,
    clientId: 'fixture-demo-season',
    appVersion: 'fixture',
    exportedAt: '2026-10-21T00:00:00.000Z',
    players: defaults.DEFAULT_PLAYERS,
    lineups,
    matches: season.matches,
    rallies: season.rallies,
    statEntries: season.statEntries,
    nightPlans: [demo.buildDemoNightPlan(lineups)],
  };

  writeFileSync(out, gzipSync(Buffer.from(JSON.stringify(payload)), { level: 9 }));
  console.log(`wrote ${out}: ${payload.matches.length} matches, ${payload.rallies.length} rallies, ${payload.statEntries.length} stat entries`);
} finally {
  await server.close();
}
