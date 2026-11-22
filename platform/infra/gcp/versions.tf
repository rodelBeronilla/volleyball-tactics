terraform {
  required_version = ">= 1.6"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }

  # Recommended once the project exists: keep state in a bucket, not on a laptop.
  #   terraform init -backend-config="bucket=<state-bucket>" -backend-config="prefix=volleyball-tactics"
  # backend "gcs" {}
}

provider "google" {
  project = var.project_id
  region  = var.region
}
