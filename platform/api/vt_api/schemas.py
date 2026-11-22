"""Wire format of the sync API.

The envelope is validated strictly (a malformed envelope is a 422). Rows inside it
are plain dicts: ``normalize.py`` validates them one by one so a single bad row
becomes a rejection instead of failing the whole batch.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class SyncPayload(BaseModel):
    """What the web app sends: its whole local state (same shape as Team → Data → Export)."""

    model_config = ConfigDict(extra="allow", populate_by_name=True)

    version: int = 2
    client_id: str = Field(alias="clientId", min_length=1, max_length=120)
    app_version: str | None = Field(default=None, alias="appVersion", max_length=60)
    exported_at: str | None = Field(default=None, alias="exportedAt")
    players: list[dict[str, Any]] = Field(default_factory=list)
    lineups: list[dict[str, Any]] = Field(default_factory=list)
    matches: list[dict[str, Any]] = Field(default_factory=list)
    rallies: list[dict[str, Any]] = Field(default_factory=list)
    stat_entries: list[dict[str, Any]] = Field(default_factory=list, alias="statEntries")
    night_plans: list[dict[str, Any]] = Field(default_factory=list, alias="nightPlans")


class RejectedRow(BaseModel):
    table: str
    id: str | None
    reason: str


class TableChanges(BaseModel):
    inserted: int = 0
    updated: int = 0
    deleted: int = 0


class SyncResponse(BaseModel):
    batch_id: str = Field(alias="batchId")
    received_at: str = Field(alias="receivedAt")
    duration_ms: int = Field(alias="durationMs")
    counts: dict[str, int]
    changes: dict[str, TableChanges]
    rejected: list[RejectedRow]
    warnings: list[str]

    model_config = ConfigDict(populate_by_name=True)


class TableSummary(BaseModel):
    table: str
    rows: int
    last_updated_at: str | None = Field(alias="lastUpdatedAt")

    model_config = ConfigDict(populate_by_name=True)


class SummaryResponse(BaseModel):
    tables: list[TableSummary]
    last_batch: dict[str, Any] | None = Field(alias="lastBatch")
    watermarks: dict[str, str]

    model_config = ConfigDict(populate_by_name=True)
