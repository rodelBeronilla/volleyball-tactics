# Pipelines

One command, five stages, two targets.

```
vt-pipeline run                      # extract → load → transform → check → reconcile
vt-pipeline run --skip extract       # what the Cloud Run job does (no database access needed)
vt-pipeline extract|load|transform|check|reconcile
vt-pipeline schedule --every 900     # the compose service: run forever, every 15 minutes
vt-pipeline list                     # models and checks with descriptions
vt-pipeline show-sql agg_rotation_performance   # the SQL as the current target will run it
```

Configuration is environment variables (`platform/pipeline/vt_pipeline/config.py`):

| Variable | Local | GCP |
| --- | --- | --- |
| `PIPELINE_TARGET` | `local` | `gcp` |
| `DATABASE_URL` | source Postgres (extract only) | same |
| `LAKE_DIR`, `DUCKDB_PATH` | folder, DuckDB file | — |
| `GCP_PROJECT`, `GCS_BUCKET`, `GCS_PREFIX`, `BQ_LOCATION`, `BQ_DATASET_*` | — | required |
| `EXTRACT_LAG_SECONDS` | 30 | 30 |
| `FRESHNESS_HOURS` | 48 | 48 |
| `SCORESHEETS_DIR` | folder | `gs://bucket/scoresheets` |
| `ALERT_WEBHOOK_URL` | optional | optional |

## Stage by stage

### extract (server)

- Opens one REPEATABLE READ snapshot. `cutoff = now() − EXTRACT_LAG_SECONDS`.
- For each parent table: `updated_at > watermark AND updated_at <= cutoff`. Children
  (slots, sets, actions, summary counts) are pulled for exactly those parents, so a batch
  always carries a parent with its complete children. `stat_types` is tiny and always
  pulled in full.
- The lag exists because `updated_at` is set when a transaction *starts*: a sync still
  committing when the run begins would otherwise end up below the watermark and be
  skipped forever. Thirty seconds is far longer than any sync transaction.
- Writes one Parquet file per table with a fixed Arrow schema (all-NULL columns stay
  typed) to `raw/<table>/dt=<day>/<batch>.parquet`, then the manifest
  `raw/_batches/<batch>.json` (files, row counts, cutoff, source row counts at the cutoff,
  scoresheet hash). The manifest is the commit point: a crash before it leaves no
  half-batch, and the watermark only advances after it.
- Scoresheet CSVs are hashed; unchanged files are not re-shipped.
- When nothing changed, no batch is written and the watermark still advances to the cutoff.

### load (server or cloud)

- Lists manifests, skips the ones already in `raw.etl_batches`, appends each file into its
  raw table (BigQuery load job from `gs://`; DuckDB `read_parquet`), records `etl_loads`
  and `etl_batches`. Running it twice loads nothing twice.
- Raw tables are created up front from the Arrow schemas (day-partitioned, clustered in
  BigQuery), so staging models always have something to read, even on an empty warehouse.

### transform

- `sql/staging/*.sql` then `sql/marts/*.sql`, ordered by the `depends_on` header
  (topological sort). Each model is `CREATE OR REPLACE TABLE … AS SELECT`; marts declare
  `partition_by` / `cluster_by` in their header and the BigQuery adapter applies them.
- Templates reference tables as `{{ layer.table }}` and parameters as `{{ name }}`. SQL is
  written in BigQuery's dialect; the DuckDB adapter transpiles it with sqlglot. Every
  model and check is parsed in both dialects by the test suite.

### check

- `sql/checks/*.sql` return *violating rows*. Each check has a `severity` header:
  `error` fails the run (exit code 1, `status = failed` in `etl_runs`); `warn` is recorded
  and alerted but does not fail the run.
- Results: one row per check per run in `marts.dq_check_results` with a JSON sample of up
  to ten violations; a `quality_check_failed` log event per failure; one alert per run.

### reconcile

- **Source vs warehouse**: the manifest captured how many active rows each source table
  had at the cutoff. Those numbers are compared with `staging.stg_* WHERE NOT is_deleted`
  and written to `marts.reconciliation_source_counts`. No connection to the source is
  needed, so it runs in the cloud too.
- **Scoresheets vs app**: `rec_scoresheet_sets` and `rec_scoresheet_players` (built by the
  transform stage) are summarised by status, and any `mismatch` / `missing_*` raises a
  warning alert.

## Scheduling

| Where | How | Stages |
| --- | --- | --- |
| Server | `pipeline` service in `compose.yaml`: `vt-pipeline schedule --every 900` | all five on the local target; `extract` only (plus load/transform/check if you like) on the gcp target |
| Cloud | Cloud Scheduler → Cloud Run job `vt-pipeline run --skip extract` every 6 hours (Terraform `pipeline_schedule`) | load, transform, check, reconcile |

Both can run at once: loads are idempotent, transforms are full rebuilds, and the job
records every run in `marts.etl_runs`.

## Scaling notes

- Extraction streams with a server-side cursor in 50k-row chunks; files are compressed
  with zstd. A season of rally-by-rally data is a few MB.
- Raw tables are partitioned by extraction day and clustered by natural key, facts by
  match date, so BigQuery scans stay proportional to the question asked.
- Staging rebuilds scan all of raw. If raw ever grows large (years of history), the
  next step is incremental staging keyed on `_batch_id`; the manifest already carries
  everything needed for it.

## Adding a model or a check

1. Add `sql/marts/<name>.sql` with a header (`model`, `layer`, `depends_on`, optional
   `partition_by`, `cluster_by`, `description`) and a SELECT in BigQuery SQL.
2. Run `pytest` in `platform/pipeline`: the render test parses it in both dialects, the
   end-to-end test builds it on DuckDB.
3. For a check, add `sql/checks/<name>.sql` with `check`, `severity`, `description`
   headers, returning violating rows, and add an assertion in
   `tests/test_local_pipeline.py::test_checks_catch_corrupted_data_and_fail_the_run`.
4. Document it in [data-quality.md](data-quality.md) or the [data dictionary](data-dictionary.md).
