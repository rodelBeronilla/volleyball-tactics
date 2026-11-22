variable "project_id" {
  description = "GCP project that hosts the cloud half of the platform."
  type        = string
}

variable "region" {
  description = "Region for Cloud Run, Artifact Registry and Cloud Scheduler."
  type        = string
  default     = "northamerica-northeast2" # Toronto
}

variable "bq_location" {
  description = "BigQuery dataset location (keep it in the same region family as the bucket)."
  type        = string
  default     = "northamerica-northeast2"
}

variable "name_prefix" {
  description = "Prefix for resource names."
  type        = string
  default     = "vt"
}

variable "github_repository" {
  description = "GitHub repository allowed to deploy through Workload Identity Federation (owner/name)."
  type        = string
  default     = "rodelBeronilla/volleyball-tactics"
}

variable "alert_email" {
  description = "Address that receives data-quality and pipeline-failure alerts. Empty disables the channel."
  type        = string
  default     = ""
}

variable "web_image" {
  description = "Initial image for the web service; CI replaces it on every deploy."
  type        = string
  default     = "us-docker.pkg.dev/cloudrun/container/hello"
}

variable "pipeline_image" {
  description = "Initial image for the pipeline job; CI replaces it on every deploy."
  type        = string
  default     = "us-docker.pkg.dev/cloudrun/container/hello"
}

variable "pipeline_schedule" {
  description = "Cron (UTC) for the warehouse job: load what the server uploaded, transform, check, reconcile."
  type        = string
  default     = "15 */6 * * *"
}

variable "enable_pipeline_job" {
  description = "Create the Cloud Run job + scheduler. Turn off if the server runs every stage itself."
  type        = bool
  default     = true
}

variable "freshness_hours" {
  description = "Freshness SLA the pipeline warns on."
  type        = number
  default     = 48
}

variable "raw_to_nearline_days" {
  description = "Move raw Parquet to Nearline after this many days."
  type        = number
  default     = 90
}
