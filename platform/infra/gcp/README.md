# GCP infrastructure (Terraform)

| File | Resources |
| --- | --- |
| `main.tf` | project services, Artifact Registry repository |
| `storage.tf` | lake bucket (`<project>-vt-lake`), public access prevented, raw → Nearline lifecycle |
| `bigquery.tf` | datasets `vt_raw`, `vt_staging`, `vt_marts` |
| `iam.tf` | service accounts (on-prem pipeline, Cloud Run job, web runtime, GitHub deployer, scheduler), least-privilege bindings, Workload Identity pool + GitHub OIDC provider |
| `run.tf` | Cloud Run service `vt-web` (public), Cloud Run job `vt-pipeline`, Cloud Scheduler trigger |
| `monitoring.tf` | log-based metrics `vt_quality_check_failed`, `vt_pipeline_run_failed`, alert policies, e-mail channel |
| `outputs.tf` | everything the server and GitHub need |

Usage: see [`docs/platform/deploy-gcp.md`](../../../docs/platform/deploy-gcp.md).

```bash
cp terraform.tfvars.example terraform.tfvars
terraform init && terraform plan && terraform apply
```

Images are deployed by CI, not Terraform: the service and job ignore image changes.
State: local by default; uncomment the `gcs` backend in `versions.tf` once you have a
state bucket.
