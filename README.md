# Volleyball Tactics

[![CI / Deploy](https://github.com/rodelBeronilla/volleyball-tactics/actions/workflows/deploy.yml/badge.svg)](https://github.com/rodelBeronilla/volleyball-tactics/actions/workflows/deploy.yml)

A coaching tool for a 6v6 volleyball team: an interactive rotation playbook, rally-by-rally stat
capture, and an analytics layer that turns the event log into player ratings, rotation reports and
lineup recommendations.

**Live site:** https://rodelberonilla.github.io/volleyball-tactics/

| Page | URL |
| --- | --- |
| Landing page | [`/volleyball-tactics/`](https://rodelberonilla.github.io/volleyball-tactics/) |
| Coaching app (opens on a demo season so every screen has data) | [`/volleyball-tactics/app/`](https://rodelberonilla.github.io/volleyball-tactics/app/) |
| Setter Signals & Set Map | [`/volleyball-tactics/setter-signals/`](https://rodelberonilla.github.io/volleyball-tactics/setter-signals/) |
| Serve Receive Rotations | [`/volleyball-tactics/serve-receive/`](https://rodelberonilla.github.io/volleyball-tactics/serve-receive/) |

| Rotation playbook | Match log | Player profile | Rotation analytics |
| --- | --- | --- | --- |
| ![Serve-receive view of rotation 1](docs/screenshots/court.png) | ![Season match list](docs/screenshots/matches.png) | ![Player profile with stat-adjusted ratings](docs/screenshots/player-profile.png) | ![Side-out and break-point rates by rotation](docs/screenshots/rotation-analytics.png) |

> The roster is fictional and the match history is simulated. See [Demo data](#demo-data).

## What it does

- **Court**: SVG court for all six rotations in offense, serve-receive and defense views. It shows
  movement arrows, passing zones and libero substitutions, and checks the overlap rule.
- **Stats**: live courtside entry (one tap per touch), play-by-play rally entry, or entry from video.
  Box scores per match and set.
- **Analysis**: data-adjusted player ratings, archetype detection, side-out / break-point rates by
  rotation, setter–hitter and front-row pairing synergy, a lineup optimizer, and plain-language
  recommendations.
- **Game Day**: plan a night of matches (lineup, serving order and substitution system per set),
  then track the score live.
- **Practice / Film**: a drill library and practice planner, plus a rally builder that replays
  tagged touches on the court.
- **Reference pages**: two standalone pages, [Setter Signals](public/setter-signals/README.md)
  and [Serve Receive](public/serve-receive/README.md), served from the same site and linked from
  the landing page.

## Data flow

Everything the analytics layer shows comes from one flat event log, so a stat recorded live,
from video, or from the simulator goes through the same aggregation.

```mermaid
flowchart LR
  A[Live entry / play-by-play / video review] --> R[Rally record<br/>touches + outcome]
  R -->|flatten| E[(statEntries<br/>event log)]
  E --> AG[Aggregation<br/>by player · rotation · match · set]
  AG --> SL[Stat lines<br/>hit %, pass avg, per-set rates]
  SL --> PR[Profile engine<br/>ratings · archetype · trends]
  SL --> RA[Rotation analytics<br/>side-out / break-point]
  PR --> OPT[Lineup optimizer<br/>and recommendations]
  E -->|old matches| C[Compaction<br/>summary rows]
  C --> AG
```

### Data model

| Entity | Key fields | Notes |
| --- | --- | --- |
| `player` | `id`, `name`, `number`, `position`, optional `baseRatings` / `archetype` | Ratings are 1–10 per attribute (attack, block, serve, pass, defense, set, speed). |
| `lineup` | `id`, `system` (5-1 / 4-2), `slots{1..6 → playerId}`, `liberoId` | Rotations 1–6 are derived from the slots, never stored. |
| `match` | `id`, `opponent`, `date`, `lineupId`, `sets[{number, ourScore, theirScore, won}]` | |
| `rally` | `id`, `matchId`, `setNumber`, `rallyNumber`, `rotation`, `servingTeam`, `ourScore`, `theirScore` (before the rally), `outcome`, `actions[{playerId, stat, order}]` | Source record for a rally. |
| `statEntry` | `id`, `matchId`, `setNumber`, `rallyId`, `playerId`, `rotation`, `stat`, `timestamp` | One row per touch, plus one team row (`playerId: '__team__'`, `rallyWon` / `rallyLost`) per rally. |
| summary `statEntry` | `type: 'summary'`, `matchId`, `playerId`, `rotation`, `setNumbers`, `counts{stat → n}` | Written by compaction; the aggregators read both shapes. |

Stat definitions (kills, errors, pass grades 0–3, blocks, digs and so on) live in
[`src/data/statCategories.js`](src/data/statCategories.js). Hitting percentage follows the box-score
definition: (kills − errors − blocked) / total attempts.

### How the numbers are built

- **Aggregation** ([`statAggregation.js`](src/utils/statAggregation.js)): counts events by player or
  rotation with optional match / set / rotation filters, then derives stat lines.
- **Ratings** ([`playerProfileEngine.js`](src/utils/playerProfileEngine.js)): each attribute starts
  from a baseline (a coach's rating, an archetype, or a position default). It then moves toward the
  rating implied by the stats as attempts accumulate: confidence is attempts divided by a threshold
  (e.g. 30 passes), so a handful of touches can't swing a rating.
- **Archetypes** ([`archetypes.js`](src/data/archetypes.js)): players are matched to 28 role
  archetypes by cosine similarity of their rating vectors.
- **Lineup optimizer** ([`lineupOptimizer.js`](src/utils/lineupOptimizer.js)): enumerates every
  legal 5-1 slot assignment and scores each one.
- **Compaction** ([`storageManager.js`](src/utils/storageManager.js)): with everything stored in the
  browser, older matches can be rolled up into per-player, per-rotation summary rows. On the demo season that
  means about 13× fewer rows and 4× less storage, with every reported number unchanged.

## Data quality

`npm test` runs [Vitest](https://vitest.dev) suites in [`src/__tests__/`](src/__tests__). Most of
them check invariants that any rally-by-rally feed should satisfy:

- Every event references a known player, match, rally and stat type, and IDs are unique.
- Set scores follow rally-scoring rules, and rally outcomes add up to the recorded final score.
- The running score is continuous from rally to rally.
- Each rally has exactly one team outcome row, and it agrees with the rally.
- Only the player in position 1 serves, and every kill has an assist.
- Compaction preserves per-player totals, per-rotation totals and player ratings.
- Rotation math, the overlap rule, and stat-line formulas are correct.

Imports are checked for structure before they replace local data, and CI runs lint, tests and a production build
on every push and pull request.

## Demo data

[`src/data/demoSeason.js`](src/data/demoSeason.js) simulates a 7-match season (about 900 rallies and
4,000 events) for the fictional roster. Each player has hidden skill levels, and rallies are played
out touch by touch: serve, pass, set, attack, block and dig. The app then has to recover those skill
levels from the event log, the same way it would for a real team. The simulator is seeded, so the
demo is identical on every load. **More → Reset to Demo Data** restores it, and **Clear All Data**
starts from an empty team.

## Tech

React 19 · Vite 8 · Tailwind CSS 4 · Vitest · ESLint 9 · GitHub Actions → GitHub Pages.
Plain JavaScript, no backend: state lives in a single `useReducer` and persists to `localStorage`,
and the whole dataset exports to and imports from JSON.

```
src/
  App.jsx              tab layout
  hooks/useAppState.js reducer, persistence, derived state (rotations, placements, profiles)
  components/          court/, stats/, analysis/, gameday/, practice/, film/, roster/, lineup/
  data/                domain data: formations, responsibilities, stat categories, drills, demo season
  utils/               aggregation, ratings, profile engine, optimizer, overlap rules, storage
  __tests__/           Vitest suites
index.html             landing page (Tailwind, no JS)
app/index.html         entry for the React coaching app
public/
  setter-signals/      standalone set-map reference page
  serve-receive/       standalone serve-receive reference page
```

## Running locally

```bash
npm ci
npm run dev       # http://localhost:5173/volleyball-tactics/ (app at /app/)
npm test          # unit + data-quality tests
npm run lint
npm run build     # production build in dist/
```

## Next steps

- Move storage from the browser to a shared database (e.g. Postgres or DuckDB) so a whole staff
  works from the same data, with the event log as the fact table.
- Export the event log as Parquet/CSV for notebooks and BI tools.
- Ingest third-party play-by-play feeds through the same rally → event pipeline, using the
  invariants above as validation checks.
