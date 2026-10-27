# Dashboards

The marts are shaped for BI tools: wide tables, one grain each, numerators and denominators
kept next to every rate so tools can re-aggregate correctly. Nothing needs a custom query
to be useful.

## Looker Studio (BigQuery)

1. Looker Studio → *Create → Data source → BigQuery* → project → `vt_marts` → table.
2. Add one data source per table below; blend only where noted.
3. Set the date field to `match_date` on the match-grain tables for the date-range control.

| Page | Table(s) | Charts |
| --- | --- | --- |
| **Season** | `agg_team_match_results` | scorecards: record (count W / L), side-out % (`SUM(sideouts)/SUM(sideout_opps)`), break-point %, hitting %; table of matches; time series of hitting % by `match_date` |
| **Rotations** | `agg_rotation_season` (season) and `agg_rotation_performance` (per match) | bar: side-out rate by rotation; bar: break-point rate by rotation; heat-map: match × rotation with `sideout_rate`; scorecards for the best/worst rotation |
| **Players** | `agg_player_season`, `agg_player_match_box` | table: box line per player; scatter: `attack_attempts` vs `hit_pct`; bar: `pass_avg` by player; line: `hit_pct` per player over matches |
| **Connections** | `agg_setter_hitter_pairs` | table or heat-map setter × hitter with `kill_rate` and `attempts` |
| **Data quality** | `dq_check_results`, `reconciliation_source_counts`, `rec_scoresheet_sets`, `rec_scoresheet_players`, `etl_runs` | table of the latest run's checks (filter `run_id = max`), scorecards for mismatches by status, run history |

Calculated fields for rates should divide the summed numerator by the summed denominator
(for example `SUM(sideouts) / SUM(sideout_opps)`), not average the pre-computed rate.

## Metabase (on the server)

`docker compose --profile bi up -d`, then *Admin → Databases → Add*:

- **Postgres** (host `postgres`, port 5432, credentials from `.env`): operational
  questions such as "which syncs were rejected this week" (`sync_batches`, `sync_rejections`).
- **BigQuery** (upload the on-prem service-account JSON, dataset filter `vt_marts`):
  the same pages as above.
- **DuckDB** (local target): Metabase has no built-in DuckDB driver; use the notebook or
  the DuckDB CLI instead.

## Notebooks

`platform/notebooks/rotation_analysis.ipynb` reproduces the Rotations and Players pages
with pandas and matplotlib against either engine (`VT_WAREHOUSE=duckdb|bigquery`).
