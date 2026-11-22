"""Connection pooling. One pool per process, opened by the FastAPI lifespan."""

from __future__ import annotations

from collections.abc import Iterator
from contextlib import contextmanager

import psycopg
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool


def make_pool(database_url: str, min_size: int = 1, max_size: int = 8) -> ConnectionPool:
    return ConnectionPool(
        conninfo=database_url,
        min_size=min_size,
        max_size=max_size,
        kwargs={"row_factory": dict_row},
        open=False,
    )


@contextmanager
def connect(database_url: str) -> Iterator[psycopg.Connection]:
    """A single short-lived connection (CLI commands, tests)."""
    with psycopg.connect(database_url, row_factory=dict_row) as conn:
        yield conn
