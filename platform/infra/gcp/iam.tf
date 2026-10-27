# ── Service accounts ─────────────────────────────────────────────────────────

# Used by the pipeline on your server: uploads batches, loads and transforms in BigQuery.
# Create its key with:  gcloud iam service-accounts keys create secrets/gcp-sa.json --iam-account=<email>
resource "google_service_account" "pipeline_onprem" {
  account_id   = "${var.name_prefix}-pipeline-onprem"
  display_name = "Volleyball Tactics pipeline (on-prem server)"
}

# Runs the Cloud Run job (load / transform / check / reconcile next to BigQuery).
resource "google_service_account" "pipeline_job" {
  account_id   = "${var.name_prefix}-pipeline-job"
  display_name = "Volleyball Tactics pipeline (Cloud Run job)"
}

# Runtime identity of the web service. It serves static files and needs no permissions.
resource "google_service_account" "web" {
  account_id   = "${var.name_prefix}-web"
  display_name = "Volleyball Tactics web (Cloud Run)"
}

# Deploys from GitHub Actions through Workload Identity Federation (no long-lived keys).
resource "google_service_account" "deployer" {
  account_id   = "${var.name_prefix}-github-deployer"
  display_name = "Volleyball Tactics GitHub Actions deployer"
}

# Triggers the pipeline job on a schedule.
resource "google_service_account" "scheduler" {
  account_id   = "${var.name_prefix}-scheduler"
  display_name = "Volleyball Tactics Cloud Scheduler"
}

# ── Pipeline permissions (both identities get the same, least-privilege set) ────

locals {
  pipeline_members = {
    onprem = "serviceAccount:${google_service_account.pipeline_onprem.email}"
    job    = "serviceAccount:${google_service_account.pipeline_job.email}"
  }
  pipeline_dataset_grants = {
    for pair in setproduct(keys(local.pipeline_members), keys(local.datasets)) :
    "${pair[0]}-${pair[1]}" => { member = local.pipeline_members[pair[0]], dataset = pair[1] }
  }
}

resource "google_storage_bucket_iam_member" "pipeline_lake" {
  for_each = local.pipeline_members
  bucket   = google_storage_bucket.lake.name
  role     = "roles/storage.objectUser"
  member   = each.value
}

resource "google_project_iam_member" "pipeline_bq_jobs" {
  for_each = local.pipeline_members
  project  = var.project_id
  role     = "roles/bigquery.jobUser"
  member   = each.value
}

resource "google_bigquery_dataset_iam_member" "pipeline_datasets" {
  for_each   = local.pipeline_dataset_grants
  dataset_id = google_bigquery_dataset.layer[each.value.dataset].dataset_id
  role       = "roles/bigquery.dataEditor"
  member     = each.value.member
}

# ── Deployer (GitHub Actions) ─────────────────────────────────────────────────

resource "google_project_iam_member" "deployer_run" {
  project = var.project_id
  role    = "roles/run.admin"
  member  = "serviceAccount:${google_service_account.deployer.email}"
}

resource "google_artifact_registry_repository_iam_member" "deployer_push" {
  location   = google_artifact_registry_repository.images.location
  repository = google_artifact_registry_repository.images.name
  role       = "roles/artifactregistry.writer"
  member     = "serviceAccount:${google_service_account.deployer.email}"
}

# Deploying a service/job that runs as another identity requires actAs on it.
resource "google_service_account_iam_member" "deployer_acts_as" {
  for_each = {
    web = google_service_account.web.name
    job = google_service_account.pipeline_job.name
  }
  service_account_id = each.value
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.deployer.email}"
}

resource "google_iam_workload_identity_pool" "github" {
  workload_identity_pool_id = "${var.name_prefix}-github"
  display_name              = "GitHub Actions"
  depends_on                = [google_project_service.enabled]
}

resource "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-oidc"
  display_name                       = "GitHub OIDC"

  attribute_mapping = {
    "google.subject"             = "assertion.sub"
    "attribute.repository"       = "assertion.repository"
    "attribute.repository_owner" = "assertion.repository_owner"
    "attribute.ref"              = "assertion.ref"
  }
  attribute_condition = "assertion.repository == \"${var.github_repository}\""

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

resource "google_service_account_iam_member" "deployer_wif" {
  service_account_id = google_service_account.deployer.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_repository}"
}
