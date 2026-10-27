# The lake: immutable Parquet batches uploaded by the server, plus scoresheet CSVs.
resource "google_storage_bucket" "lake" {
  name                        = "${var.project_id}-${var.name_prefix}-lake"
  location                    = var.bq_location
  storage_class               = "STANDARD"
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  labels                      = local.labels

  versioning {
    enabled = false
  }

  lifecycle_rule {
    condition {
      age            = var.raw_to_nearline_days
      matches_prefix = ["lake/raw/"]
    }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }

  depends_on = [google_project_service.enabled]
}
