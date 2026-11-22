"""Plain-SQL migrations.

Files in ``vt_api/migrations/`` run once each, in name order, inside a transaction,
and are recorded in ``schema_migrations``. After migrating, the reference table
``stat_types`` is (re)seeded idempotently.
"""

from __future__ import annotations

import logging
from importlib import resources

import psycopg

from .stat_types import STAT_TYPES

log = logging.getLogger(__name__)


def _migration_files() -> list[tuple[str, str]]:
    folder = resources.files("vt_api") / "migrations"
    files = sorted(p for p in folder.iterdir() if p.name.endswith(".sql"))
    return [(p.name, p.read_text(encoding="utf-8")) for p in files]


def migrate(conn: psycopg.Connection) -> list[str]:
    """Apply pending migrations and seed reference data. Returns the versions applied."""
    applied: list[str] = []
    with conn.transaction():
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version     text PRIMARY KEY,
                applied_at  timestamptz NOT NULL DEFAULT now()
            )
            """
        )
        # Serialise concurrent migrators (two API replicas starting at once).
        conn.execute("LOCK TABLE schema_migrations IN EXCLUSIVE MODE")
        done = {r["version"] for r in conn.execute("SELECT version FROM schema_migrations").fetchall()}
        for name, sql in _migration_files():
            if name in done:
                continue
            log.info("applying migration %s", name)
            conn.execute(sql)  # type: ignore[arg-type]
            conn.execute("INSERT INTO schema_migrations (version) VALUES (%s)", (name,))
            applied.append(name)
        seed_stat_types(conn)
    return applied


def seed_stat_types(conn: psycopg.Connection) -> None:
    with conn.cursor() as cur:
        cur.executemany(
            """
            INSERT INTO stat_types (stat, label, stat_group, positive, attribute)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (stat) DO UPDATE
               SET label = EXCLUDED.label, stat_group = EXCLUDED.stat_group,
                   positive = EXCLUDED.positive, attribute = EXCLUDED.attribute
            """,
            STAT_TYPES,
        )
