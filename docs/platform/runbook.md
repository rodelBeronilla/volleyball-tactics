# Runbook

Short procedures for the things that will actually happen. Commands assume
`platform/` on the server (`docker compose …`) or a Cloud Run job on GCP.

## A data-quality check failed

1. Find the run: `SELECT * FROM vt_marts.dq_check_results WHERE NOT passed ORDER BY checked_at DESC` (DuckDB: `marts.dq_check_results`). The `sample` column holds up to ten offending rows.
2. Match the check to its guarantee in [data-quality.md](data-quality.md).
3. Usual causes:
   - **Reference checks** (`events_reference_known_player`, `…known_match`): a sync was rejected or partially applied. Look at `GET /v1/batches` for rejections; fix the data in the app and re-sync.
   - **Score checks** (`set_scores_match_rally_outcomes`, `running_score_is_continuous`, `one_team_row_per_rally`): a rally was edited or deleted by hand in the app. Open the match in *Game → Record Stats*, use *Undo last rally* or re-enter, then sync.
   - **`staging_keys_are_unique`**: should never fire; it means two raw rows share an id and `updated_at`. Check `etl_loads` for a batch loaded twice (then delete that batch's rows from raw and re-run `load`).
4. Re-run: `docker compose exec pipeline vt-pipeline run --skip extract` (or `gcloud run jobs execute vt-pipeline --wait`). A green run closes the alert automatically.

## Replaying or backfilling

- The lake is the source of truth for the warehouse. To rebuild from scratch: delete the
  three datasets (or the DuckDB file), then `vt-pipeline load && vt-pipeline transform`.
  Every manifest is loaded in order.
- To re-ship a table from Postgres (for example after a bug fix in the extractor):
  `UPDATE etl_watermarks SET watermark = '1970-01-01' WHERE table_name = 'stat_events'`
  on the source, then run `extract`. Staging de-duplicates, so the warehouse stays correct.
- To re-ingest scoresheets, edit the CSV; the hash changes and the next run ships it.

## The server was offline

Nothing to do. Syncs from the app will fail while it is down (the status line in
*Team → Data* says so) and succeed on the next change or *Sync now*. The pipeline resumes
from its watermark. The Cloud Run job keeps rebuilding the warehouse from the batches
already in the bucket.

## Rotating the sync token

1. Change `SYNC_TOKEN` in `.env`; `docker compose up -d api`.
2. Give coaches the new token; until they enter it, their syncs get a 401 and the app
   shows *The server rejected the sync token*.

## Rotating the GCP key

```bash
gcloud iam service-accounts keys create platform/secrets/gcp-sa.json --iam-account <onprem SA>
docker compose restart pipeline
gcloud iam service-accounts keys list --iam-account <onprem SA>     # delete the old one
```

## Schema migration

Add `platform/api/vt_api/migrations/00N_<name>.sql` (forward-only; wrap destructive
changes in an expand/contract pair). `vt-api migrate` runs on container start and records
the version. Then extend `vt_pipeline/schemas.py` and the extraction SQL for new columns,
add them to the staging model, and run both test-suites.

## Restoring Postgres

```bash
gunzip -c vt-YYYY-MM-DD.sql.gz | docker compose exec -T postgres psql -U vt vt
```

Then set every watermark back (`UPDATE etl_watermarks SET watermark = '1970-01-01'`) so
the next extract re-ships everything; the warehouse de-duplicates.

## Alert fatigue

`warn` checks never fail a run. If a league plays capped sets, `set_scores_follow_rally_scoring`
will warn on every run: lower its severity to… nothing, by deleting the file, or change
the threshold in the SQL. `kills_have_assists` is noisy for teams that record play by play
loosely; same remedy.
