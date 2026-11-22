"""Pipeline configuration. Everything comes from environment variables (or a .env file).

Two targets share one code path:

* ``local``  — Parquet files in a folder, DuckDB as the warehouse. Used for development,
  tests and CI; also a perfectly good single-machine deployment.
* ``gcp``    — Parquet files in a Cloud Storage bucket, BigQuery as the warehouse.
"""

from __future__ import annotations

from pathlib import Path
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class PipelineSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    pipeline_target: Literal["local", "gcp"] = "local"

    # Source: the operational Postgres the API writes to. Needed by `extract` and `schedule`.
    database_url: str | None = Field(default=None, description="psycopg connection string of the source database")

    # Local target
    lake_dir: Path = Field(default=Path(".lake"), description="Folder that plays the role of the data lake")
    duckdb_path: Path | None = Field(default=None, description="DuckDB file; defaults to <lake_dir>/warehouse.duckdb")

    # GCP target
    gcp_project: str | None = None
    gcs_bucket: str | None = None
    gcs_prefix: str = "lake"
    bq_location: str = "northamerica-northeast2"
    bq_dataset_raw: str = "vt_raw"
    bq_dataset_staging: str = "vt_staging"
    bq_dataset_marts: str = "vt_marts"

    # Behaviour
    extract_lag_seconds: int = Field(
        default=30, description="Only ship rows older than this, so in-flight transactions are never skipped"
    )
    freshness_hours: int = Field(default=48, description="Warn when the newest extract is older than this")
    scoresheets_dir: str | None = Field(
        default=None, description="Folder (or gs:// prefix) with official scoresheet CSVs, the third-party source"
    )
    alert_webhook_url: str | None = Field(default=None, description="POST failed checks here (Slack / n8n / Discord)")

    @property
    def duckdb_file(self) -> Path:
        return self.duckdb_path or (self.lake_dir / "warehouse.duckdb")
