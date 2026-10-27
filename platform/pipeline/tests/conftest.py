"""Pipeline test fixtures.

The end-to-end tests load the demo season into a throwaway Postgres through the API
package (``vt_api``), then run the pipeline against the local target (Parquet in a
temp folder, DuckDB as the warehouse). ``TEST_DATABASE_URL`` points at the database;
the default matches the API tests.
"""

from __future__ import annotations

import gzip
import json
import os
from pathlib import Path

import psycopg
import pytest

from vt_pipeline.config import PipelineSettings

FIXTURES = Path(__file__).resolve().parents[2] / "fixtures"
TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL", "postgresql://vt:vt@localhost:5433/vt_test")


@pytest.fixture(scope="session")
def demo_payload() -> dict:
    with gzip.open(FIXTURES / "demo_season_sync.json.gz", "rt", encoding="utf-8") as fh:
        return json.load(fh)


def sync_payload(database_url: str, payload: dict) -> None:
    """Push a snapshot into the source database the way POST /v1/sync does."""
    vt_api_normalize = pytest.importorskip("vt_api.normalize")
    from vt_api.db import connect
    from vt_api.schemas import SyncPayload
    from vt_api.sync import apply_sync

    normalized = vt_api_normalize.normalize(SyncPayload.model_validate(payload))
    assert not normalized.rejections, normalized.rejections
    with connect(database_url) as conn:
        apply_sync(conn, normalized, client_id=payload["clientId"], app_version="test", payload_sha256="x")


@pytest.fixture()
def source_db(demo_payload: dict) -> str:
    pytest.importorskip("vt_api")
    from vt_api.db import connect
    from vt_api.migrate import migrate

    try:
        with psycopg.connect(TEST_DATABASE_URL, connect_timeout=5):
            pass
    except psycopg.OperationalError as exc:  # pragma: no cover
        pytest.skip(f"no test database at {TEST_DATABASE_URL}: {exc}")
    with connect(TEST_DATABASE_URL) as conn:
        conn.execute("DROP SCHEMA public CASCADE")
        conn.execute("CREATE SCHEMA public")
        conn.commit()
        migrate(conn)
        conn.commit()
    sync_payload(TEST_DATABASE_URL, demo_payload)
    return TEST_DATABASE_URL


@pytest.fixture()
def settings(tmp_path: Path, source_db: str) -> PipelineSettings:
    return PipelineSettings(
        pipeline_target="local",
        database_url=source_db,
        lake_dir=tmp_path / "lake",
        scoresheets_dir=str(FIXTURES / "scoresheets"),
        freshness_hours=48,
        extract_lag_seconds=0,
        alert_webhook_url=None,
    )
