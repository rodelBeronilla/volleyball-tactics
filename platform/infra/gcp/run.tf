# ── Web app ──────────────────────────────────────────────────────────────────

resource "google_cloud_run_v2_service" "web" {
  name                = "${var.name_prefix}-web"
  location            = var.region
  ingress             = "INGRESS_TRAFFIC_ALL"
  deletion_protection = false
  labels              = local.labels

  template {
    service_account = google_service_account.web.email
    scaling {
      min_instance_count = 0
      max_instance_count = 3
    }
    containers {
      image = var.web_image
      ports {
        container_port = 8080
      }
      resources {
        limits   = { cpu = "1", memory = "256Mi" }
        cpu_idle = true
      }
    }
  }

  # CI deploys new images with gcloud; Terraform must not roll them back.
  lifecycle {
    ignore_changes = [template[0].containers[0].image, client, client_version]
  }

  depends_on = [google_project_service.enabled]
}

resource "google_cloud_run_v2_service_iam_member" "web_public" {
  name     = google_cloud_run_v2_service.web.name
  location = google_cloud_run_v2_service.web.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# ── Pipeline job: load → transform → check → reconcile, next to BigQuery ──────

resource "google_cloud_run_v2_job" "pipeline" {
  count               = var.enable_pipeline_job ? 1 : 0
  name                = "${var.name_prefix}-pipeline"
  location            = var.region
  deletion_protection = false
  labels              = local.labels

  template {
    task_count = 1
    template {
      service_account = google_service_account.pipeline_job.email
      max_retries     = 1
      timeout         = "1800s"
      containers {
        image = var.pipeline_image
        args  = ["run", "--skip", "extract"]
        env {
          name  = "PIPELINE_TARGET"
          value = "gcp"
        }
        env {
          name  = "GCP_PROJECT"
          value = var.project_id
        }
        env {
          name  = "GCS_BUCKET"
          value = google_storage_bucket.lake.name
        }
        env {
          name  = "BQ_LOCATION"
          value = var.bq_location
        }
        env {
          name  = "BQ_DATASET_RAW"
          value = google_bigquery_dataset.layer["raw"].dataset_id
        }
        env {
          name  = "BQ_DATASET_STAGING"
          value = google_bigquery_dataset.layer["staging"].dataset_id
        }
        env {
          name  = "BQ_DATASET_MARTS"
          value = google_bigquery_dataset.layer["marts"].dataset_id
        }
        env {
          name  = "FRESHNESS_HOURS"
          value = tostring(var.freshness_hours)
        }
        env {
          name  = "SCORESHEETS_DIR"
          value = "gs://${google_storage_bucket.lake.name}/scoresheets"
        }
        resources {
          limits = { cpu = "1", memory = "1Gi" }
        }
      }
    }
  }

  lifecycle {
    ignore_changes = [template[0].template[0].containers[0].image, client, client_version]
  }

  depends_on = [google_project_service.enabled]
}

resource "google_cloud_run_v2_job_iam_member" "scheduler_runs_pipeline" {
  count    = var.enable_pipeline_job ? 1 : 0
  name     = google_cloud_run_v2_job.pipeline[0].name
  location = google_cloud_run_v2_job.pipeline[0].location
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.scheduler.email}"
}

resource "google_cloud_scheduler_job" "pipeline" {
  count       = var.enable_pipeline_job ? 1 : 0
  name        = "${var.name_prefix}-pipeline"
  description = "Load the server's uploads into BigQuery, rebuild the marts, run checks and reconciliation."
  region      = var.region
  schedule    = var.pipeline_schedule
  time_zone   = "Etc/UTC"

  retry_config {
    retry_count = 1
  }

  http_target {
    http_method = "POST"
    uri         = "https://${var.region}-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${var.project_id}/jobs/${google_cloud_run_v2_job.pipeline[0].name}:run"
    oauth_token {
      service_account_email = google_service_account.scheduler.email
    }
  }

  depends_on = [google_cloud_run_v2_job_iam_member.scheduler_runs_pipeline]
}
