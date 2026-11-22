"""Runtime configuration (12-factor: everything comes from the environment)."""

from __future__ import annotations

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = Field(
        default="postgresql://vt:vt@localhost:5432/vt",
        description="psycopg connection string for the operational Postgres database.",
    )
    sync_token: str | None = Field(
        default=None,
        description="Shared secret the web app sends as a bearer token. Sync is refused until this is set.",
    )
    cors_origins: str = Field(
        default="http://localhost:5173",
        description="Comma-separated browser origins allowed to call the API.",
    )
    max_payload_mb: int = Field(default=25, description="Reject sync payloads larger than this.")
    pool_min_size: int = 1
    pool_max_size: int = 8

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]
