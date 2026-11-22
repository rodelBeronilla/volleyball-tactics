# Data dictionary

Three places hold data, each with a different job.

| Store | Role | Owner |
| --- | --- | --- |
| Postgres (`platform/api/vt_api/migrations/001_init.sql`) | System of record. Enforces constraints, keeps history. | API |
| Lake (`raw/<table>/dt=YYYY-MM-DD/<batch>.parquet`) | Immutable batches between the two halves. Schemas in `platform/pipeline/vt_pipeline/schemas.py`. | Pipeline |
| Warehouse: `vt_raw`, `vt_staging`, `vt_marts` | Analytics. Models in `platform/pipeline/vt_pipeline/sql/`. | Pipeline |

Identifiers are the app's own ids (`p6`, `demo-match-3`, `rally-…`), so any warehouse row
can be traced back to what the coach saw on screen.

## Postgres (operational)

Every synced table carries the same audit columns:

| Column | Meaning |
| --- | --- |
| `client_id` | The browser that last wrote the row (random UUID stored in that browser). |
| `content_hash` | SHA-256 of the normalised row and its children. The upsert only touches the row when it differs, so `updated_at` moves only on real change. |
| `created_at`, `updated_at` | Server clock. `updated_at` drives incremental extraction. |
| `deleted_at` | Set when a snapshot from the owning client no longer contains the row. Never physically deleted. |

| Table | Grain | Notes |
| --- | --- | --- |
| `stat_types` | one row per event type | Reference. Seeded from `vt_api/stat_types.py`; a test fails if it drifts from `src/data/statCategories.js`. |
| `players` | player | `position` ∈ setter, outside, middle, opposite, libero, ds. `base_ratings`, `rating_history` kept as JSON. |
| `lineups` + `lineup_slots` | lineup; lineup × slot 1–6 | Slots are the rotation-1 positions; rotations 2–6 are derived. `libero_id` is optional. |
| `matches` + `match_sets` | match; match × set | `match_date` from the app's `date`. `lineup_id` is a soft reference (lineups can be deleted later). |
| `rallies` + `rally_actions` | rally; rally × touch | Scores are *before* the rally. `serving_team` ∈ us/them, `outcome` ∈ won/lost. Actions are ordered touches with a stat key. |
| `stat_events` | one row per touch, plus one team row per rally | `is_team_event = (player_id IS NULL)`; team rows carry `rallyWon`/`rallyLost`. Quick-tap entries have no `rally_id`. |
| `stat_event_summaries` + `_counts` | compacted per player, per rotation, per match | Output of *Team → Data → Compact*; `set_numbers` is a JSON array. |
| `night_plans` | plan | Stored as a JSON document; not modelled further yet. |
| `sync_batches`, `sync_rejections` | one per sync; one per rejected row | Provenance and triage. `/v1/batches` serves them. |
| `etl_watermarks` | one per extracted parent table | High-water mark the pipeline reads and advances. |

Validation policy on ingest (see `vt_api/normalize.py`): required references (an event's
player/match/rally, an action's player, every stat key) must resolve or the row is
rejected and reported; optional references (a lineup's libero or slot, a match's lineup)
are cleared with a warning.

## Warehouse

### `vt_raw`

One table per source table, same columns as the Parquet files plus `_batch_id`,
`_extracted_at`, `_source` (`postgres` or `scoresheet_csv`). Append-only; a row that
changed appears once per batch it changed in. Day-partitioned on `_extracted_at`,
clustered on the natural key. Bookkeeping: `etl_loads` (file → table), `etl_batches`
(manifest, source counts at the cutoff).

### `vt_staging`

The current version of every row: `QUALIFY ROW_NUMBER() OVER (PARTITION BY id ORDER BY updated_at DESC, _extracted_at DESC) = 1`.
Soft deletes survive as `is_deleted = TRUE` so marts decide what to hide. Child tables
join their parent on `_batch_id`, which guarantees a parent and its children come from
the same extraction. Scoresheet tables keep the latest copy of each CSV file.

### `vt_marts`

| Table | Grain | Key columns |
| --- | --- | --- |
| `dim_players` | player | `player_id`, `name`, `jersey_number`, `position`, `archetype`, `is_deleted` |
| `dim_matches` | active match | `match_date`, `season`, `opponent`, `lineup_name`, `sets_played/won/lost`, `result` (W/L/NULL) |
| `fct_rallies` | rally | `rotation`, `serving_team`, `*_score_before`, `won`, `is_sideout_opportunity`, `is_breakpoint_opportunity`, `point_type`, `n_touches`, `n_attacks`, `n_kills`. Partitioned by `match_date`, clustered by `match_id, rotation`. |
| `fct_stat_events` | touch (+ team rows) | event + player + stat attributes (`stat_group`, `positive`, `attribute`). Partitioned by `match_date`, clustered by `player_id, stat`. |
| `agg_team_set_results` | match × set | recorded score, rallies won/lost, side-out and break-point opportunities, conversions and rates |
| `agg_team_match_results` | match | result, side-out %, break-point %, team hitting %, kills, aces, blocks, digs, assists, pass average |
| `agg_rotation_performance` | match × rotation | the same, per rotation; numerators and denominators kept |
| `agg_rotation_season` | season × rotation | roll-up of the above |
| `agg_player_match_box` | player × match | the full box line (every stat key) plus derived numbers and `sets_played` |
| `agg_player_season` | season × player | season line with per-set rates |
| `agg_setter_hitter_pairs` | season × setter × hitter | attempts, kills, errors, hitting %, kill rate |
| `rec_scoresheet_sets` | scoresheet set ∪ app set | `status` ∈ match, mismatch, missing_in_app, missing_in_scoresheet; score diffs |
| `rec_scoresheet_players` | scoresheet line ∪ app box line | per-stat diffs (sheet − app); blank sheet columns are not compared |
| `dq_check_results` | run × check | `violations`, `passed`, JSON `sample` of offending rows |
| `reconciliation_source_counts` | run × table | source rows at the cutoff vs warehouse rows |
| `etl_runs` | run | stages, status, details |

### Metric definitions

They match `src/utils/statAggregation.js` and `src/utils/seasonSummary.js` so the app, the
warehouse and the dashboards never disagree.

| Metric | Definition |
| --- | --- |
| Kills | `kill + attackTip + attackTooled` |
| Attack errors | `attackError + attackBlocked` (a blocked attack is an error) |
| Attack attempts | kills + attack errors + `attackAttempt` (kept in play) |
| Hitting % | (kills − attack errors) / attempts |
| Pass average | (3·perfect + 2·good + 1·poor) / passes, on the 0–3 scale |
| Blocks | `blockSolo + blockAssist` |
| Side-out % | rallies won on the opponent's serve / rallies on the opponent's serve |
| Break-point % | rallies won on our serve / rallies on our serve |
| Sets played (player) | distinct (match, set) in which the player recorded an event, plus the sets of any compacted summaries |
| Per-set rates | total / sets played |
| Result | W when sets won > sets lost on a completed match, L when fewer, NULL while in progress |

### Setter–hitter pairing

Within a rally the *k*-th attack is paired with the *k*-th setting touch (`assist` or
`setAttempt`). This is how both the simulator and the play-by-play screen record them
(a set and its attack are logged together). Overpass kills with no setting touch stay
unpaired and do not appear in `agg_setter_hitter_pairs`.
