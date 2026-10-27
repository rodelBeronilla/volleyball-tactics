# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server with HMR
npm run build      # Production build to dist/
npm run preview    # Preview production build locally
npm run lint       # ESLint (flat config, JS/JSX only)
npm test           # Vitest (src/__tests__/)
```

CI (`.github/workflows/deploy.yml`) runs lint, tests and build on every push and PR, and deploys `main` to GitHub Pages.
`platform-ci.yml` lints and tests the data platform (Postgres service container, DuckDB end to end, Terraform validate, image builds);
`deploy-cloud-run.yml` deploys to Cloud Run once the repository variables from Terraform are set.

Data platform (`platform/`, Python 3.12, one venv for both packages):

```bash
cd platform && python -m venv .venv && . .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -e "api[dev]" -e "pipeline[dev]"
docker run -d -e POSTGRES_USER=vt -e POSTGRES_PASSWORD=vt -e POSTGRES_DB=vt_test -p 5433:5432 postgres:16-alpine
ruff check api pipeline && ruff format --check api pipeline
(cd api && pytest -q)         # needs TEST_DATABASE_URL or the container above on :5433
(cd pipeline && pytest -q)    # loads the demo season into Postgres, runs every stage on DuckDB
vt-pipeline run               # PIPELINE_TARGET=local|gcp, see docs/platform/pipelines.md
```

Node is not on this machine's PATH; run the app's lint/tests/build through Docker:
`docker run --rm -v "$PWD:/app" -v vt-node-modules:/app/node_modules -w /app node:22-alpine sh -c "npm ci && npm run lint && npm test && npm run build"`.

## Architecture

Single React 19 app (plain JavaScript, no TypeScript) for volleyball coaching, organised into five sections: Home, Playbook, Game, Analytics, Team.

- **Navigation:** `src/nav.js` is the site map (sections → pages with titles and descriptions); the desktop sidebar, mobile bottom bar and section tabs, page headers and Home all read it. `src/router.js` is a tiny hash router (`#/analytics/players/p6`). `src/App.jsx` maps routes to pages; unknown routes redirect to a valid page.
- **Layout:** `src/components/shell/` — `Navigation.jsx` (sidebar ≥ `lg`, bottom bar below), `Page.jsx` (section tabs on mobile, title/description/controls/actions, scrolling body), `ui.jsx` (Card, StatTile, SectionTitle, Empty), `styles.js` (button and table class strings).
- **Server sync:** `src/utils/sync.js` builds the export payload (plus a per-browser `clientId`) and POSTs it to `{url}/v1/sync`; `src/hooks/useServerSync.js` debounces pushes when sync is enabled and keeps status in `localStorage`. Settings UI lives in `components/team/DataSettings.jsx`. The API contract is `platform/api/vt_api/schemas.py` and `normalize.py`; the stat vocabulary must match `src/data/statCategories.js` (a Python test enforces it).
- **Embedded tools:** Setter Signals and Serve Receive are standalone single-file pages in `public/tools/`. The app runs them in a same-origin iframe (`components/playbook/ToolFrame.jsx`, tab config in `tools.js`): inside an iframe they add `html.embedded` and hide their own nav; the app calls `window.SetterSignals.showTab()` / `window.ServeReceive.showTab()`, and they `postMessage` tab changes back. Opened top-level over http they redirect into the app; as a local file they still work standalone. `public/setter-signals/`, `public/serve-receive/` and `public/app/` are redirects from old URLs.

**Stack:** Vite 8, React 19, Tailwind CSS v4 (via `@tailwindcss/vite` plugin), ESLint 9 flat config. Deployed to GitHub Pages at `/volleyball-tactics/` base path.

### State Management

All app state lives in a single `useReducer` in `src/hooks/useAppState.js`. The reducer handles player CRUD, lineup CRUD, rotation navigation, formation/responsibility selection, player drag overrides, matches/rallies/stat entries and game-night plans. Navigation is not in the reducer; it lives in the URL. State is persisted to `localStorage` via `src/utils/storage.js` (each key saved independently via `useEffect`).

The hook also derives computed data: `activeLineup`, `currentSlots` (who occupies each rotational position after rotation math), `placements` (court x/y coordinates per player combining formation defaults + per-lineup overrides + libero auto-substitution).

### Domain Model

- **Players** have a position (setter, outside, middle, opposite, libero, ds) and a jersey number
- **Lineups** assign players to slots 1-6 with an optional libero. Lineups store per-rotation position overrides (`overrides.r{N}.{slot}`)
- **Rotations** 1-6 are standard volleyball rotations derived in `src/utils/rotations.js` via `deriveRotation()`
- **Formations** (`src/data/formations.js`) define x/y placements for each slot in each rotation (e.g., serve-receive 5-1)
- **Responsibilities** (`src/data/responsibilities.js`) define per-rotation duties by role
- **Strategy data** (`src/data/strategyData.js`) and **route data** (`src/data/routeData.js`) power the strategy cards and movement arrows. Formations, routes and responsibilities assume the slot template in `SLOT_ROLE_MAP` (1=S, 2=OPP, 3=MB1, 4=OH1, 5=MB2, 6=OH2)
- **Demo season** (`src/data/demoSeason.js`) is a seeded rally simulator; its output fills matches/rallies/statEntries (plus a planned game night) on first launch. Team-level numbers come from `src/utils/seasonSummary.js`. The default roster is fictional — keep real people's names and notes out of the repo

### Component Layout

- `src/components/home/` — Home page
- `src/components/playbook/` — `CourtPage.jsx` (court + rotation summary; player card inline on desktop, bottom sheet on phones), `ToolFrame.jsx`
- `src/components/game/` — `RecordPage.jsx`; Game Plan uses `src/components/gameday/`
- `src/components/analytics/` — Season (results table, box score), rotation analytics, optimizer, pairings, recommendations
- `src/components/team/` — Data & settings; roster and lineups use `src/components/roster/` and `src/components/lineup/`
- `src/components/court/` — SVG court rendering: `Court.jsx` (main SVG), `PlayerToken.jsx`, `CourtMarkings.jsx`, `MovementArrows.jsx`, `ArrowDefs.jsx`, `OverlapIndicator.jsx`, `PlayerStrategyCard.jsx`
- `src/components/stats/` — stat entry (live, rally by rally, video), match detail, player profiles

### Court Rendering

The court is an SVG with a 100x100 viewBox. Player positions use SVG `transform` attributes (not CSS transforms). Position coordinates are percentages within this viewBox. The `OverlapIndicator` validates legal positioning per volleyball rules (`src/utils/overlap.js`).

### Data platform layout

- `platform/api/vt_api/` — `migrations/*.sql` (plain SQL, forward-only), `normalize.py` (payload → rows, rejections), `sync.py` (bulk upsert via `unnest`, content hashes, client-scoped soft deletes), `main.py` (FastAPI).
- `platform/pipeline/vt_pipeline/` — `source_postgres.py` (incremental extract, REPEATABLE READ, cutoff with lag), `source_scoresheets.py` (CSV third-party source), `lake.py` (local / GCS), `warehouse.py` (DuckDB / BigQuery adapters; SQL written in BigQuery dialect, transpiled with sqlglot for DuckDB), `sql/{staging,marts,checks}/*.sql` with `-- key: value` headers, `checks.py`, `stages.py`, `cli.py`.
- Metric definitions in the marts must stay identical to `src/utils/statAggregation.js`; `docs/platform/data-dictionary.md` lists them.
- `platform/fixtures/` — `demo_season_sync.json.gz` (regenerate with `node platform/fixtures/build-demo-fixture.mjs`) and `scoresheets/` (regenerate with `python platform/fixtures/make_scoresheets.py`); both test-suites depend on them.
- Never commit `platform/.env`, `platform/secrets/`, `platform/scoresheets/` (real league data) or Terraform state.

### Styling

Tailwind v4 with theme tokens in the `src/index.css` `@theme` block. The surface/line/ink/muted/accent palette matches the embedded tools' CSS variables so the whole site reads as one product; text on accent backgrounds uses `--color-accent-ink`. Dark theme throughout; desktop layout from the `lg` breakpoint.

### ESLint

`no-unused-vars` ignores variables starting with uppercase or underscore (`varsIgnorePattern: '^[A-Z_]'`). React Hooks and React Refresh plugins are active.
