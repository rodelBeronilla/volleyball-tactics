# Deploying the cloud half on Google Cloud

What you get: the Parquet lake in Cloud Storage, BigQuery datasets, a Cloud Run job that
rebuilds the warehouse on a schedule, the web app on Cloud Run, log-based alerts, and
keyless deploys from GitHub Actions.

Requirements: a GCP project with billing, `gcloud` logged in, Terraform ≥ 1.6. Everything
below is in `platform/infra/gcp`. Expected cost for a rec-league season is well under
a few dollars a month (BigQuery and Cloud Storage free tiers cover it; Cloud Run scales to
zero).

## 1. Terraform

```bash
cd platform/infra/gcp
cp terraform.tfvars.example terraform.tfvars      # project_id, alert_email, region
gcloud auth application-default login
terraform init
terraform apply
terraform output                                   # keep this open for the next steps
```

Created: APIs, Artifact Registry repo, bucket `<project>-vt-lake` (public access prevented,
raw files to Nearline after 90 days), datasets `vt_raw` / `vt_staging` / `vt_marts`, five
service accounts with least-privilege roles, Workload Identity pool + provider restricted
to this repository, Cloud Run service `vt-web` (placeholder image until the first deploy),
Cloud Run job `vt-pipeline` + Cloud Scheduler, two log-based metrics with alert policies.

## 2. GitHub Actions variables

Copy the `github_actions_variables` output into the repository's
**Settings → Secrets and variables → Actions → Variables** (they are not secrets; auth is
Workload Identity Federation). Add `VITE_API_URL` = the public URL of the API on your
server (`https://vt-api.example.com`).

Push to `main` (or run the *Deploy to Cloud Run* workflow): it builds the web and pipeline
images, pushes them to Artifact Registry, deploys the service and updates the job. The
workflow is skipped entirely until `GCP_PROJECT_ID` is set, so forks and PRs are
unaffected.

Add the Cloud Run URL (`terraform output web_url`) to `CORS_ORIGINS` on the server and
restart the API.

## 3. Point the server at the cloud

Create a key for the on-prem pipeline identity and switch the target:

```bash
gcloud iam service-accounts keys create platform/secrets/gcp-sa.json \
  --iam-account "$(terraform -chdir=platform/infra/gcp output -raw pipeline_onprem_service_account)"
```

In `platform/.env`:

```
PIPELINE_TARGET=gcp
GCP_PROJECT=<project>
GCS_BUCKET=<project>-vt-lake
BQ_LOCATION=northamerica-northeast2
```

`docker compose up -d pipeline`. From now on the server uploads batches to
`gs://<bucket>/lake/raw/…`, and (because the server's `run` does every stage) loads and
transforms BigQuery as well. The scheduled Cloud Run job does the same without the
extract step, so the warehouse is current even while the server is off. Either can be
turned off: `--skip` flags on the server, `enable_pipeline_job = false` in Terraform.

Scoresheets in the cloud: upload CSVs to `gs://<bucket>/scoresheets/` (the job reads
that prefix) or keep them on the server, which ships them with the next batch.

## 4. Verify

```bash
gcloud run jobs execute vt-pipeline --region northamerica-northeast2 --wait
bq query --use_legacy_sql=false 'SELECT rotation, sideout_rate, breakpoint_rate FROM `<project>.vt_marts.agg_rotation_season` ORDER BY 1'
bq query --use_legacy_sql=false 'SELECT check_name, severity, violations FROM `<project>.vt_marts.dq_check_results` WHERE run_id = (SELECT MAX(run_id) FROM `<project>.vt_marts.dq_check_results`)'
```

Logs: Cloud Logging, filter `jsonPayload.component="vt-pipeline"`. Alerts: Monitoring →
Alerting (e-mail channel from `alert_email`).

## 5. Dashboards and notebooks

- Looker Studio: *Create → Data source → BigQuery → vt_marts* and start with
  `agg_rotation_season`, `agg_team_match_results`, `agg_player_season`,
  `dq_check_results`. Suggested pages are in [`platform/dashboards/README.md`](../../platform/dashboards/README.md).
- Notebooks: `platform/notebooks/rotation_analysis.ipynb` runs against BigQuery with
  `VT_WAREHOUSE=bigquery GCP_PROJECT=<project>` (needs `pip install google-cloud-bigquery db-dtypes`).

## Keys and rotation

- The only long-lived credential is the on-prem service-account key. Rotate it with
  `gcloud iam service-accounts keys create` / `delete`; the roles are object user on one
  bucket and data editor on three datasets.
- GitHub never holds a key: the deployer identity is assumed through the OIDC provider,
  and only from `rodelBeronilla/volleyball-tactics`.

## Tear down

`terraform destroy` removes everything except data: the bucket and datasets refuse to
delete while they hold objects/tables (`delete_contents_on_destroy = false`). Empty them
first if you really mean it.
