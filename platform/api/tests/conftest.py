"""Test fixtures.

Tests run against a real Postgres (the schema uses jsonb, CHECK constraints and
``unnest`` upserts that SQLite cannot emulate). Point ``TEST_DATABASE_URL`` at a
throwaway database; the default matches ``docker run -p 5433:5432 postgres:16``
with user/password ``vt`` and database ``vt_test``. The public schema is dropped
and recreated for every test.
"""

from __future__ import annotations

import gzip
import json
import os
from pathlib import Path

import psycopg
import pytest
from fastapi.testclient import TestClient

from vt_api.config import Settings
from vt_api.db import connect
from vt_api.main import create_app
from vt_api.migrate import migrate

FIXTURES = Path(__file__).resolve().parents[2] / "fixtures"
TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL", "postgresql://vt:vt@localhost:5433/vt_test")
TOKEN = "test-token"


@pytest.fixture(scope="session")
def database_url() -> str:
    try:
        with psycopg.connect(TEST_DATABASE_URL, connect_timeout=5):
            pass
    except psycopg.OperationalError as exc:  # pragma: no cover
        pytest.skip(f"no test database at {TEST_DATABASE_URL}: {exc}")
    return TEST_DATABASE_URL


@pytest.fixture()
def db(database_url: str) -> str:
    with connect(database_url) as conn:
        conn.execute("DROP SCHEMA public CASCADE")
        conn.execute("CREATE SCHEMA public")
        conn.commit()
        migrate(conn)
        conn.commit()
    return database_url


@pytest.fixture()
def settings(db: str) -> Settings:
    return Settings(database_url=db, sync_token=TOKEN, cors_origins="http://localhost:5173")


@pytest.fixture()
def client(settings: Settings):
    with TestClient(create_app(settings)) as c:
        yield c


@pytest.fixture()
def auth() -> dict[str, str]:
    return {"Authorization": f"Bearer {TOKEN}"}


@pytest.fixture(scope="session")
def demo_payload() -> dict:
    with gzip.open(FIXTURES / "demo_season_sync.json.gz", "rt", encoding="utf-8") as fh:
        return json.load(fh)
