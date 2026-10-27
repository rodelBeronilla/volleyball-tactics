# The pipeline logs one JSON object per event. Two of them become metrics and alerts:
#   quality_check_failed  (severity_level = error)  → a check with error severity found violations
#   run_finished          (status != success)       → a run failed or crashed

resource "google_logging_metric" "quality_check_failed" {
  name        = "${var.name_prefix}_quality_check_failed"
  description = "Data-quality checks (error severity) that found violations"
  filter      = <<-EOT
    jsonPayload.component="vt-pipeline"
    AND jsonPayload.event="quality_check_failed"
    AND jsonPayload.severity_level="error"
  EOT

  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
    labels {
      key         = "check"
      value_type  = "STRING"
      description = "Check name"
    }
  }
  label_extractors = {
    check = "EXTRACT(jsonPayload.check)"
  }

  depends_on = [google_project_service.enabled]
}

resource "google_logging_metric" "pipeline_run_failed" {
  name        = "${var.name_prefix}_pipeline_run_failed"
  description = "Pipeline runs that did not finish successfully"
  filter      = <<-EOT
    jsonPayload.component="vt-pipeline"
    AND jsonPayload.event="run_finished"
    AND jsonPayload.status!="success"
  EOT

  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
  }

  depends_on = [google_project_service.enabled]
}

resource "google_monitoring_notification_channel" "email" {
  count        = var.alert_email == "" ? 0 : 1
  display_name = "Volleyball Tactics data alerts"
  type         = "email"
  labels = {
    email_address = var.alert_email
  }
  depends_on = [google_project_service.enabled]
}

locals {
  alert_metrics = {
    quality_check_failed = {
      metric  = google_logging_metric.quality_check_failed.name
      display = "Data quality check failed"
      doc     = "A pipeline check with error severity found violating rows. Look at vt_marts.dq_check_results for the run, then docs/platform/runbook.md."
    }
    pipeline_run_failed = {
      metric  = google_logging_metric.pipeline_run_failed.name
      display = "Pipeline run failed"
      doc     = "A pipeline run finished with status failed or error. Check the Cloud Run job logs (or the server's pipeline container) and vt_marts.etl_runs."
    }
  }
}

resource "google_monitoring_alert_policy" "pipeline" {
  for_each     = local.alert_metrics
  display_name = "Volleyball Tactics: ${each.value.display}"
  combiner     = "OR"
  severity     = "ERROR"

  conditions {
    display_name = each.value.display
    condition_threshold {
      filter          = "resource.type=\"global\" OR resource.type=\"cloud_run_job\" OR resource.type=\"cloud_run_revision\" metric.type=\"logging.googleapis.com/user/${each.value.metric}\""
      comparison      = "COMPARISON_GT"
      threshold_value = 0
      duration        = "0s"
      aggregations {
        alignment_period     = "300s"
        per_series_aligner   = "ALIGN_SUM"
        cross_series_reducer = "REDUCE_SUM"
      }
      trigger {
        count = 1
      }
    }
  }

  notification_channels = [for c in google_monitoring_notification_channel.email : c.id]

  alert_strategy {
    auto_close = "86400s"
  }

  documentation {
    content   = each.value.doc
    mime_type = "text/markdown"
  }
}
