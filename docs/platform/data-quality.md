# Data quality

Quality is enforced at three points, each catching what the previous one cannot.

## 1. At ingest (API)

`POST /v1/sync` validates every row before anything is written
(`platform/api/vt_api/normalize.py`):

- Types and ranges: rotations 1–6, scores ≥ 0, set numbers ≥ 1, dates parse, serving
  team and outcome are from the fixed vocabularies.
- Vocabulary: every stat key must be one of the 29 in `stat_types` (mirrors the app;
  a contract test keeps them identical).
- Referential integrity: an event's player, match and rally, an action's player, must
  exist in the same payload. Rows that fail are **rejected**, reported in the response and
  stored in `sync_rejections` for triage. Rejections cascade (a rejected rally takes its
  events with it, each with its own reason).
- Optional references (a lineup's libero or slot player, a match's lineup) are cleared
  with a warning rather than rejected, because the app itself leaves them dangling after
  a delete.
- Duplicate ids within a payload keep the last occurrence and produce a warning.
- The database adds its own guard rails: CHECK constraints, foreign keys, and
  `is_team_event = (player_id IS NULL)`.

## 2. In the warehouse (checks)

Run by `vt-pipeline check`; results in `vt_marts.dq_check_results`. `error` fails the run,
`warn` is recorded and alerted.

| Check | Severity | What it guarantees |
| --- | --- | --- |
| `events_reference_known_player` | error | Every player event names a known player. |
| `events_and_rallies_reference_known_match` | error | Every active event and rally belongs to a known match. |
| `set_scores_match_rally_outcomes` | error | For sets with rally data, rallies won = our score and rallies lost = their score. |
| `one_team_row_per_rally` | error | Exactly one team outcome row per rally, agreeing with the rally. |
| `running_score_is_continuous` | error | Each rally starts where the previous one ended; sets start 0–0. |
| `serve_events_only_when_serving` | error | Aces, service errors and serves in play only in rallies we served. |
| `staging_keys_are_unique` | error | De-duplication leaves one row per key in staging. |
| `hit_pct_within_bounds` | error | Hitting % within [−1, 1], attempts never negative. |
| `rotation_in_range` | error | Rotations 1–6 on every rally and event. |
| `kills_have_assists` | warn | Kills and assists per rally agree (an overpass kill is a legitimate exception). |
| `set_scores_follow_rally_scoring` | warn | Finished sets reach 25 and are won by two (capped leagues will warn). |
| `freshness` | warn | The newest loaded batch is younger than `FRESHNESS_HOURS`. |
| `jersey_numbers_are_unique` | warn | Active players do not share a number (scoresheets are matched on it). |

The first six are the same invariants the app's own test-suite asserts on the simulated
season (`src/__tests__/demoSeason.test.js`), now enforced on real data every run.

## 3. Across sources (reconciliation)

| Reconciliation | Output | Alert |
| --- | --- | --- |
| Source row counts (captured at the extraction cutoff) vs warehouse staging | `vt_marts.reconciliation_source_counts` | warning on any mismatch |
| Official scoresheet set scores vs the app's recorded sets, matched on date + opponent + set | `vt_marts.rec_scoresheet_sets` (`match`, `mismatch`, `missing_in_app`, `missing_in_scoresheet`) | warning |
| Official per-player lines (kills, aces, blocks, digs, assists) vs the app's box score, matched on date + opponent + jersey number | `vt_marts.rec_scoresheet_players` with per-stat diffs | warning |

The sample scoresheets in `platform/fixtures/scoresheets/` are generated from the demo
season with four planted differences; the end-to-end test asserts that exactly those are
flagged and nothing else.

## Alerting

- Every failed check and every reconciliation difference is a structured log event
  (`quality_check_failed`, `alert`) with the check name, counts and a sample.
- On GCP, Terraform creates two log-based metrics and alert policies (data-quality
  failure, pipeline run failure) with an e-mail channel.
- Anywhere, `ALERT_WEBHOOK_URL` receives a JSON POST with a Slack-style `text` field
  (works with Slack, Discord, n8n, or a tiny HTTP endpoint on the server).

## When a check fails

See the [runbook](runbook.md#a-data-quality-check-failed).
