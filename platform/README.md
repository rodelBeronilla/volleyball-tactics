# Data platform

The coaching app keeps everything in the browser. This folder turns it into a shared,
hybrid data platform: the **system of record runs on your own server**, the
**warehouse and dashboards run on Google Cloud**, and one pipeline connects them.

```
browser ──POST /v1/sync──▶ API + Postgres (your server) ──Parquet──▶ Cloud Storage ──▶ BigQuery ──▶ Looker Studio / notebooks
                                                         └──────────── DuckDB (same pipeline, no cloud) ───────┘
```

| Piece | Where it runs | What it is |
| --- | --- | --- |
| [`api/`](api) | your server (Docker) | FastAPI + Postgres. Receives the app's snapshots, validates every row, keeps history (soft deletes, change detection, batch provenance). |
| [`pipeline/`](pipeline) | your server **and** Cloud Run | Extract (incremental) → Parquet lake → load → SQL models → quality checks → reconciliation. Local target = DuckDB; cloud target = Cloud Storage + BigQuery. Same SQL on both. |
| [`infra/gcp/`](infra/gcp) | Google Cloud | Terraform: bucket, BigQuery datasets, Cloud Run (web + pipeline job), Scheduler, log-based alerts, Workload Identity Federation for GitHub Actions. |
| [`web/`](web) | Cloud Run | nginx image of the React app, built with the API URL baked in. |
| [`compose.yaml`](compose.yaml) | your server | Postgres, API, pipeline scheduler; optional Caddy (HTTPS) and Metabase (self-hosted dashboards). |
| [`notebooks/`](notebooks) | anywhere | Jupyter notebook that queries the marts (DuckDB or BigQuery). |
| [`dashboards/`](dashboards) | Looker Studio / Metabase | How to connect and which tables to use. |
| [`fixtures/`](fixtures) | tests | The demo season as a sync payload, plus sample league scoresheets with planted discrepancies. |

Documentation lives in [`docs/platform/`](../docs/platform): [architecture](../docs/platform/architecture.md),
[data dictionary](../docs/platform/data-dictionary.md), [pipelines](../docs/platform/pipelines.md),
[data quality](../docs/platform/data-quality.md), [server deployment](../docs/platform/deploy-server.md),
[GCP deployment](../docs/platform/deploy-gcp.md), [runbook](../docs/platform/runbook.md), and the
[decision records](../docs/adr).

## Try it locally in ten minutes

Needs Python 3.12 and Docker (for Postgres).

```bash
docker run -d --name vt-pg -e POSTGRES_USER=vt -e POSTGRES_PASSWORD=vt -e POSTGRES_DB=vt_test -p 5433:5432 postgres:16-alpine

cd platform
python -m venv .venv && . .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -e "api[dev]" -e "pipeline[dev]"

# 1. The API: migrate, then serve
export DATABASE_URL=postgresql://vt:vt@localhost:5433/vt_test SYNC_TOKEN=dev-token
vt-api migrate && vt-api serve --port 8080 &

# 2. Push the demo season the way the web app does
python - <<'EOF'
import gzip, json, urllib.request
body = gzip.open("fixtures/demo_season_sync.json.gz").read()
req = urllib.request.Request("http://localhost:8080/v1/sync", body, {"Content-Type": "application/json", "Authorization": "Bearer dev-token"})
print(json.load(urllib.request.urlopen(req))["changes"])
EOF

# 3. Run the pipeline on the local target (Parquet in ./.lake, DuckDB warehouse)
export PIPELINE_TARGET=local LAKE_DIR=.lake SCORESHEETS_DIR=fixtures/scoresheets
vt-pipeline run
vt-pipeline list                     # models and checks
duckdb .lake/warehouse.duckdb "SELECT rotation, sideout_rate, breakpoint_rate FROM marts.agg_rotation_season ORDER BY 1"
```

Or run the whole thing as tests: `pytest` in `api/` and in `pipeline/` (the pipeline suite
loads the demo season into Postgres, runs every stage against DuckDB, and checks the marts
against the app's own numbers).

## Deploying

1. **Server**: [`docs/platform/deploy-server.md`](../docs/platform/deploy-server.md) — `docker compose up -d`, set the token in the app.
2. **Google Cloud**: [`docs/platform/deploy-gcp.md`](../docs/platform/deploy-gcp.md) — `terraform apply`, set the GitHub variables, flip the server's pipeline to `PIPELINE_TARGET=gcp`.
