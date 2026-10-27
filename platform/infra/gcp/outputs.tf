output "web_url" {
  description = "Public URL of the web app (add it to CORS_ORIGINS on the server)."
  value       = google_cloud_run_v2_service.web.uri
}

output "lake_bucket" {
  description = "Set as GCS_BUCKET on the server."
  value       = google_storage_bucket.lake.name
}

output "bigquery_datasets" {
  value = { for k, d in google_bigquery_dataset.layer : k => "${var.project_id}.${d.dataset_id}" }
}

output "pipeline_onprem_service_account" {
  description = "Create a key for this account and mount it as platform/secrets/gcp-sa.json on the server."
  value       = google_service_account.pipeline_onprem.email
}

output "artifact_registry" {
  description = "Image prefix used by CI."
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.images.repository_id}"
}

output "github_actions_variables" {
  description = "Repository variables to set in GitHub (Settings → Secrets and variables → Actions → Variables)."
  value = {
    GCP_PROJECT_ID           = var.project_id
    GCP_REGION               = var.region
    GCP_WIF_PROVIDER         = google_iam_workload_identity_pool_provider.github.name
    GCP_DEPLOYER_SA          = google_service_account.deployer.email
    GCP_ARTIFACT_REGISTRY    = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.images.repository_id}"
    CLOUD_RUN_WEB_SERVICE    = google_cloud_run_v2_service.web.name
    CLOUD_RUN_PIPELINE_JOB   = var.enable_pipeline_job ? google_cloud_run_v2_job.pipeline[0].name : ""
    PIPELINE_SERVICE_ACCOUNT = google_service_account.pipeline_job.email
    WEB_SERVICE_ACCOUNT      = google_service_account.web.email
  }
}
