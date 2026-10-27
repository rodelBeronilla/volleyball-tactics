# Three layers, three datasets. Table definitions live in the pipeline (Arrow schemas for
# raw, SQL models for staging and marts), so Terraform only owns the containers.
locals {
  datasets = {
    raw     = "Append-only landing tables: one row per source record per extraction batch."
    staging = "Current version of every source record, typed and de-duplicated."
    marts   = "Facts, dimensions and aggregates for dashboards, notebooks and reconciliation."
  }
}

resource "google_bigquery_dataset" "layer" {
  for_each = local.datasets

  dataset_id                 = "${var.name_prefix}_${each.key}"
  friendly_name              = "Volleyball Tactics ${each.key}"
  description                = each.value
  location                   = var.bq_location
  delete_contents_on_destroy = false
  labels                     = merge(local.labels, { layer = each.key })

  depends_on = [google_project_service.enabled]
}
