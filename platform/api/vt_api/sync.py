"""Apply a normalised snapshot to Postgres in one transaction.

For every parent table:

1. **Bulk upsert** with ``INSERT ... SELECT FROM unnest(...) ON CONFLICT DO UPDATE``.
   The update only fires when ``content_hash`` differs (or the row was soft-deleted),
   so ``updated_at`` is a reliable change marker for incremental extraction.
2. **Replace children** (slots, sets, actions, summary counts) for the parents that
   actually changed; untouched parents keep their children.
3. **Soft-delete** rows that this client wrote before but left out of the snapshot.
   Deletions are scoped to the client that last wrote the row, so one device can
   never wipe what another device recorded.

Finally the batch and its rejections are recorded for provenance.
"""

from __future__ import annotations

import json
import time
import uuid
from dataclasses import dataclass, field
from typing import Any

import psycopg

from .normalize import CHILD_OF, PARENT_TABLES, Normalized


@dataclass(frozen=True)
class ChildSpec:
    table: str
    parent_key: str
    columns: dict[str, str]  # column → SQL type


@dataclass(frozen=True)
class ParentSpec:
    columns: dict[str, str]  # column → SQL type (excluding id, content_hash, audit columns)
    children: tuple[ChildSpec, ...] = ()


SPECS: dict[str, ParentSpec] = {
    "players": ParentSpec(
        {
            "name": "text",
            "number": "integer",
            "position": "text",
            "base_ratings": "jsonb",
            "archetype": "text",
            "rating_history": "jsonb",
        }
    ),
    "lineups": ParentSpec(
        {"name": "text", "system": "text", "libero_id": "text", "overrides": "jsonb"},
        (ChildSpec("lineup_slots", "lineup_id", {"slot": "smallint", "player_id": "text"}),),
    ),
    "matches": ParentSpec(
        {
            "opponent": "text",
            "match_date": "date",
            "lineup_id": "text",
            "completed": "boolean",
            "night_plan_set_ref": "jsonb",
        },
        (
            ChildSpec(
                "match_sets",
                "match_id",
                {"set_number": "smallint", "our_score": "smallint", "their_score": "smallint", "won": "boolean"},
            ),
        ),
    ),
    "rallies": ParentSpec(
        {
            "match_id": "text",
            "set_number": "smallint",
            "rally_number": "integer",
            "rotation": "smallint",
            "serving_team": "text",
            "our_score_before": "smallint",
            "their_score_before": "smallint",
            "outcome": "text",
        },
        (ChildSpec("rally_actions", "rally_id", {"action_order": "smallint", "player_id": "text", "stat": "text"}),),
    ),
    "stat_events": ParentSpec(
        {
            "match_id": "text",
            "set_number": "smallint",
            "rally_id": "text",
            "player_id": "text",
            "is_team_event": "boolean",
            "rotation": "smallint",
            "stat": "text",
            "serving_team": "text",
            "event_ts": "timestamptz",
            "video_ts": "double precision",
        }
    ),
    "stat_event_summaries": ParentSpec(
        {"match_id": "text", "player_id": "text", "rotation": "smallint", "set_numbers": "jsonb"},
        (ChildSpec("stat_event_summary_counts", "summary_id", {"stat": "text", "n": "integer"}),),
    ),
    "night_plans": ParentSpec({"name": "text", "plan_date": "date", "plan": "jsonb"}),
}

# How each SQL type travels: as which array type in the bind parameter, and how it is
# cast on the way into the table. Text-ish types ride as text[] and are cast in SQL so
# the driver never has to guess (jsonb, date and timestamptz arrive as strings).
_TRANSPORT: dict[str, tuple[str, str]] = {
    "text": ("text", ""),
    "jsonb": ("text", "::jsonb"),
    "date": ("text", "::date"),
    "timestamptz": ("text", "::timestamptz"),
    "integer": ("integer", ""),
    "smallint": ("integer", ""),
    "boolean": ("boolean", ""),
    "double precision": ("float8", ""),
}


@dataclass
class SyncResult:
    batch_id: str
    received_at: str
    duration_ms: int
    changes: dict[str, dict[str, int]] = field(default_factory=dict)


def _column_arrays(rows: list[dict[str, Any]], columns: list[str]) -> dict[str, list[Any]]:
    return {c: [r.get(c) for r in rows] for c in columns}


def _upsert_parent(cur: psycopg.Cursor, table: str, spec: ParentSpec, rows: list[dict[str, Any]], client_id: str):
    """Returns ({changed ids}, inserted, updated)."""
    if not rows:
        return set(), 0, 0
    cols = ["id", *spec.columns.keys(), "content_hash"]
    types = {"id": "text", "content_hash": "text", **spec.columns}
    unnest_args = ", ".join(f"%({c})s::{_TRANSPORT[types[c]][0]}[]" for c in cols)
    select_list = ", ".join(f"t.{c}{_TRANSPORT[types[c]][1]}" for c in cols)
    set_list = ", ".join(f"{c} = EXCLUDED.{c}" for c in cols if c != "id")
    sql = f"""
        INSERT INTO {table} ({", ".join(cols)}, client_id, created_at, updated_at, deleted_at)
        SELECT {select_list}, %(client_id)s, now(), now(), NULL
        FROM unnest({unnest_args}) AS t({", ".join(cols)})
        ON CONFLICT (id) DO UPDATE SET
            {set_list},
            client_id = EXCLUDED.client_id,
            updated_at = now(),
            deleted_at = NULL
        WHERE {table}.content_hash IS DISTINCT FROM EXCLUDED.content_hash
           OR {table}.deleted_at IS NOT NULL
        RETURNING id, (xmax = 0) AS inserted
    """
    params = {**_column_arrays(rows, cols), "client_id": client_id}
    cur.execute(sql, params)  # type: ignore[arg-type]
    changed = cur.fetchall()
    inserted = sum(1 for r in changed if r["inserted"])
    return {r["id"] for r in changed}, inserted, len(changed) - inserted


def _replace_children(
    cur: psycopg.Cursor, child: ChildSpec, by_parent: dict[str, list[dict[str, Any]]], parent_ids: set[str]
) -> None:
    if not parent_ids:
        return
    ids = sorted(parent_ids)
    cur.execute(f"DELETE FROM {child.table} WHERE {child.parent_key} = ANY(%s)", (ids,))
    rows = [{child.parent_key: pid, **r} for pid in ids for r in by_parent.get(pid, [])]
    if not rows:
        return
    cols = [child.parent_key, *child.columns.keys()]
    types = {child.parent_key: "text", **child.columns}
    unnest_args = ", ".join(f"%({c})s::{_TRANSPORT[types[c]][0]}[]" for c in cols)
    select_list = ", ".join(f"t.{c}{_TRANSPORT[types[c]][1]}" for c in cols)
    cur.execute(
        f"INSERT INTO {child.table} ({', '.join(cols)}) SELECT {select_list} "
        f"FROM unnest({unnest_args}) AS t({', '.join(cols)})",
        _column_arrays(rows, cols),  # type: ignore[arg-type]
    )


def _soft_delete_missing(cur: psycopg.Cursor, table: str, client_id: str, keep_ids: list[str]) -> int:
    cur.execute(
        f"""
        UPDATE {table} AS t
           SET deleted_at = now(), updated_at = now()
         WHERE t.client_id = %(client_id)s
           AND t.deleted_at IS NULL
           AND NOT EXISTS (SELECT 1 FROM unnest(%(ids)s::text[]) AS u(id) WHERE u.id = t.id)
        """,
        {"client_id": client_id, "ids": keep_ids},
    )
    return cur.rowcount


def apply_sync(
    conn: psycopg.Connection,
    normalized: Normalized,
    *,
    client_id: str,
    app_version: str | None,
    payload_sha256: str,
) -> SyncResult:
    started = time.perf_counter()
    batch_id = str(uuid.uuid4())
    changes: dict[str, dict[str, int]] = {}

    with conn.transaction(), conn.cursor() as cur:
        for table in PARENT_TABLES:
            spec = SPECS[table]
            rows = normalized.parents.get(table, [])
            changed_ids, inserted, updated = _upsert_parent(cur, table, spec, rows, client_id)
            for child in spec.children:
                _replace_children(cur, child, normalized.children.get(child.table, {}), changed_ids)
            changes[table] = {"inserted": inserted, "updated": updated, "deleted": 0}

        # Deletions last, children first in dependency terms is irrelevant for soft deletes,
        # but events before rallies before matches keeps the counts easy to read.
        for table in reversed(PARENT_TABLES):
            changes[table]["deleted"] = _soft_delete_missing(cur, table, client_id, normalized.ids(table))

        duration_ms = int((time.perf_counter() - started) * 1000)
        cur.execute(
            """
            INSERT INTO sync_batches (id, client_id, app_version, payload_sha256, row_counts, changes,
                                      rejected_count, duration_ms)
            VALUES (%s, %s, %s, %s, %s::jsonb, %s::jsonb, %s, %s)
            RETURNING received_at
            """,
            (
                batch_id,
                client_id,
                app_version,
                payload_sha256,
                json.dumps(normalized.counts),
                json.dumps(changes),
                len(normalized.rejections),
                duration_ms,
            ),
        )
        received_at = cur.fetchone()["received_at"]
        if normalized.rejections:
            cur.executemany(
                "INSERT INTO sync_rejections (batch_id, table_name, row_id, reason, row) "
                "VALUES (%s, %s, %s, %s, %s::jsonb)",
                [
                    (batch_id, r.table, r.row_id, r.reason, json.dumps(r.row, default=str) if r.row else None)
                    for r in normalized.rejections
                ],
            )

    return SyncResult(batch_id, received_at.isoformat(), duration_ms, changes)


def table_summary(conn: psycopg.Connection) -> list[dict[str, Any]]:
    out = []
    for table in PARENT_TABLES:
        row = conn.execute(
            f"SELECT count(*) AS rows, max(updated_at) AS last FROM {table} WHERE deleted_at IS NULL"
        ).fetchone()
        out.append(
            {"table": table, "rows": row["rows"], "lastUpdatedAt": row["last"].isoformat() if row["last"] else None}
        )
    return out


def last_batch(conn: psycopg.Connection) -> dict[str, Any] | None:
    row = conn.execute(
        """
        SELECT id, client_id, app_version, received_at, row_counts, changes, rejected_count, duration_ms
          FROM sync_batches ORDER BY received_at DESC LIMIT 1
        """
    ).fetchone()
    if not row:
        return None
    return {
        "batchId": str(row["id"]),
        "clientId": row["client_id"],
        "appVersion": row["app_version"],
        "receivedAt": row["received_at"].isoformat(),
        "counts": row["row_counts"],
        "changes": row["changes"],
        "rejected": row["rejected_count"],
        "durationMs": row["duration_ms"],
    }


def watermarks(conn: psycopg.Connection) -> dict[str, str]:
    rows = conn.execute("SELECT table_name, watermark FROM etl_watermarks ORDER BY table_name").fetchall()
    return {r["table_name"]: r["watermark"].isoformat() for r in rows}


__all__ = ["CHILD_OF", "SPECS", "SyncResult", "apply_sync", "last_batch", "table_summary", "watermarks"]
