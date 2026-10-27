"""Incremental extraction from the operational Postgres.

Parent tables are pulled by ``watermark < updated_at <= cutoff``; their child tables
(slots, sets, actions, summary counts) are pulled for exactly those parents, so a
batch always holds a parent together with its complete set of children. Reference
data (``stat_types``) is small and extracted in full every run.

``cutoff`` is the database clock at the start of the run minus a safety lag
(``EXTRACT_LAG_SECONDS``): rows written by a transaction still open when the run
started would otherwise carry an ``updated_at`` below the watermark and be missed
for good. The whole run reads one REPEATABLE READ snapshot, so every table and the
source row counts describe the same instant. The watermark is the cutoff, kept in
``etl_watermarks`` in the source database, and only advanced after the batch
manifest has been written.
"""

from __future__ import annotations

import secrets
import tempfile
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

import psycopg
import pyarrow as pa
import pyarrow.parquet as pq
from psycopg.rows import dict_row

from .events import emit
from .lake import Lake
from .schemas import META, RAW_SCHEMAS, WATERMARKED

EPOCH = datetime(1970, 1, 1, tzinfo=UTC)
CHUNK_ROWS = 50_000

_AUDIT = "client_id, created_at, updated_at, deleted_at"
_WINDOW = "updated_at > %(wm)s AND updated_at <= %(cutoff)s"
_PARENT_WINDOW = "{p}.updated_at > %(wm)s AND {p}.updated_at <= %(cutoff)s"

# table → (SQL, watermark table or None for full refresh)
EXTRACT: dict[str, tuple[str, str | None]] = {
    "stat_types": ("SELECT stat, label, stat_group, positive, attribute FROM stat_types ORDER BY stat", None),
    "players": (
        "SELECT id, name, number, position, base_ratings::text AS base_ratings, archetype, "
        f"rating_history::text AS rating_history, {_AUDIT} FROM players WHERE {_WINDOW} ORDER BY updated_at, id",
        "players",
    ),
    "lineups": (
        f"SELECT id, name, system, libero_id, overrides::text AS overrides, {_AUDIT} "
        f"FROM lineups WHERE {_WINDOW} ORDER BY updated_at, id",
        "lineups",
    ),
    "lineup_slots": (
        "SELECT s.lineup_id, s.slot, s.player_id FROM lineup_slots s JOIN lineups l ON l.id = s.lineup_id "
        f"WHERE {_PARENT_WINDOW.format(p='l')} ORDER BY s.lineup_id, s.slot",
        "lineups",
    ),
    "matches": (
        "SELECT id, opponent, match_date, lineup_id, completed, night_plan_set_ref::text AS night_plan_set_ref, "
        f"{_AUDIT} FROM matches WHERE {_WINDOW} ORDER BY updated_at, id",
        "matches",
    ),
    "match_sets": (
        "SELECT s.match_id, s.set_number, s.our_score, s.their_score, s.won FROM match_sets s "
        f"JOIN matches m ON m.id = s.match_id WHERE {_PARENT_WINDOW.format(p='m')} ORDER BY s.match_id, s.set_number",
        "matches",
    ),
    "rallies": (
        "SELECT id, match_id, set_number, rally_number, rotation, serving_team, our_score_before, their_score_before, "
        f"outcome, {_AUDIT} FROM rallies WHERE {_WINDOW} ORDER BY updated_at, id",
        "rallies",
    ),
    "rally_actions": (
        "SELECT a.rally_id, a.action_order, a.player_id, a.stat FROM rally_actions a "
        f"JOIN rallies r ON r.id = a.rally_id WHERE {_PARENT_WINDOW.format(p='r')} ORDER BY a.rally_id, a.action_order",
        "rallies",
    ),
    "stat_events": (
        "SELECT id, match_id, set_number, rally_id, player_id, is_team_event, rotation, stat, serving_team, event_ts, "
        f"video_ts, {_AUDIT} FROM stat_events WHERE {_WINDOW} ORDER BY updated_at, id",
        "stat_events",
    ),
    "stat_event_summaries": (
        f"SELECT id, match_id, player_id, rotation, set_numbers::text AS set_numbers, {_AUDIT} "
        f"FROM stat_event_summaries WHERE {_WINDOW} ORDER BY updated_at, id",
        "stat_event_summaries",
    ),
    "stat_event_summary_sets": (
        "SELECT s.id AS summary_id, (e.value #>> '{}')::int AS set_number FROM stat_event_summaries s "
        f"CROSS JOIN LATERAL jsonb_array_elements(s.set_numbers) e WHERE {_PARENT_WINDOW.format(p='s')} ORDER BY 1, 2",
        "stat_event_summaries",
    ),
    "stat_event_summary_counts": (
        "SELECT c.summary_id, c.stat, c.n FROM stat_event_summary_counts c "
        f"JOIN stat_event_summaries s ON s.id = c.summary_id WHERE {_PARENT_WINDOW.format(p='s')} ORDER BY 1, 2",
        "stat_event_summaries",
    ),
    "night_plans": (
        f"SELECT id, name, plan_date, plan::text AS plan, {_AUDIT} FROM night_plans "
        f"WHERE {_WINDOW} ORDER BY updated_at, id",
        "night_plans",
    ),
}


@dataclass
class ExtractResult:
    batch_id: str
    extracted_at: datetime
    cutoff: datetime
    files: dict[str, dict[str, Any]] = field(default_factory=dict)  # table → {uri, rows, source}
    watermarks: dict[str, datetime] = field(default_factory=dict)  # new watermark per parent table
    source_counts: dict[str, int] = field(default_factory=dict)  # active rows per parent, as of cutoff

    @property
    def incremental_rows(self) -> int:
        return sum(f["rows"] for t, f in self.files.items() if EXTRACT.get(t, (None, None))[1] is not None)


def new_batch_id(now: datetime) -> str:
    return f"{now:%Y%m%dT%H%M%S}Z-{secrets.token_hex(3)}"


def read_watermarks(conn: psycopg.Connection) -> dict[str, datetime]:
    rows = conn.execute("SELECT table_name, watermark FROM etl_watermarks").fetchall()
    return {r["table_name"]: r["watermark"] for r in rows}


def write_watermarks(conn: psycopg.Connection, marks: dict[str, datetime], batch_id: str | None) -> None:
    with conn.transaction(), conn.cursor() as cur:
        for table, wm in marks.items():
            cur.execute(
                """
                INSERT INTO etl_watermarks (table_name, watermark, batch_id, updated_at)
                VALUES (%s, %s, %s, now())
                ON CONFLICT (table_name) DO UPDATE
                   SET watermark = GREATEST(etl_watermarks.watermark, EXCLUDED.watermark),
                       batch_id = COALESCE(EXCLUDED.batch_id, etl_watermarks.batch_id),
                       updated_at = now()
                """,
                (table, wm, batch_id),
            )


def source_counts(conn: psycopg.Connection, cutoff: datetime) -> dict[str, int]:
    """Rows alive at the cutoff: created by then and not deleted by then."""
    out = {}
    for table in WATERMARKED:
        out[table] = conn.execute(
            f"SELECT count(*) AS n FROM {table} "
            "WHERE created_at <= %(c)s AND (deleted_at IS NULL OR deleted_at > %(c)s)",
            {"c": cutoff},
        ).fetchone()["n"]
    return out


def write_parquet(
    rows_iter, table: str, batch_id: str, extracted_at: datetime, source: str, dest: Path
) -> tuple[int, datetime | None]:
    """Stream rows into a Parquet file with the table's fixed schema. Returns (rows, max updated_at)."""
    schema = RAW_SCHEMAS[table]
    meta_values = {"_batch_id": batch_id, "_extracted_at": extracted_at, "_source": source}
    rows_written = 0
    max_updated: datetime | None = None
    writer: pq.ParquetWriter | None = None
    try:
        for chunk in rows_iter:
            if not chunk:
                continue
            for r in chunk:
                r.update(meta_values)
                u = r.get("updated_at")
                if u is not None and (max_updated is None or u > max_updated):
                    max_updated = u
            batch = pa.Table.from_pylist(chunk, schema=schema)
            if writer is None:
                writer = pq.ParquetWriter(dest, schema, compression="zstd")
            writer.write_table(batch)
            rows_written += len(chunk)
        if writer is None:  # no rows: still write an empty, well-typed file
            writer = pq.ParquetWriter(dest, schema, compression="zstd")
            writer.write_table(pa.Table.from_pylist([], schema=schema))
    finally:
        if writer is not None:
            writer.close()
    return rows_written, max_updated


def _chunks(cur: psycopg.Cursor, size: int = CHUNK_ROWS):
    while True:
        rows = cur.fetchmany(size)
        if not rows:
            return
        yield rows


def extract(conn: psycopg.Connection, lake: Lake, *, lag_seconds: int = 30) -> ExtractResult:
    """Pull everything that changed since the last run into the lake."""
    conn.row_factory = dict_row
    conn.isolation_level = psycopg.IsolationLevel.REPEATABLE_READ
    db_now: datetime = conn.execute("SELECT now() AS now").fetchone()["now"]  # opens the snapshot
    cutoff = db_now - timedelta(seconds=lag_seconds)
    result = ExtractResult(batch_id=new_batch_id(db_now), extracted_at=db_now, cutoff=cutoff)
    marks = read_watermarks(conn)
    tmpdir = Path(tempfile.mkdtemp(prefix="vt-extract-"))

    for table, (sql, wm_table) in EXTRACT.items():
        params = {"wm": marks.get(wm_table, EPOCH), "cutoff": cutoff} if wm_table else None
        dest = tmpdir / f"{table}.parquet"
        with conn.cursor(name=f"extract_{table}") as cur:  # server-side cursor: streams large tables
            cur.itersize = CHUNK_ROWS
            cur.execute(sql, params)  # type: ignore[arg-type]
            rows, _ = write_parquet(_chunks(cur), table, result.batch_id, db_now, "postgres", dest)
        if rows == 0 and wm_table is not None:
            dest.unlink(missing_ok=True)
            continue
        rel = f"raw/{table}/dt={db_now:%Y-%m-%d}/{result.batch_id}.parquet"
        uri = lake.put_file(dest, rel)
        result.files[table] = {"uri": uri, "rows": rows, "source": "postgres"}
        emit("extract_table", table=table, rows=rows, batch_id=result.batch_id)

    result.watermarks = dict.fromkeys(WATERMARKED, cutoff)
    result.source_counts = source_counts(conn, cutoff)
    return result


def finish_batch(
    conn: psycopg.Connection,
    lake: Lake,
    result: ExtractResult,
    extra_files: dict[str, dict[str, Any]] | None = None,
    scoresheets_sha256: str | None = None,
) -> None:
    """Write the manifest (the commit point of a batch) and then advance the watermarks."""
    files = {**result.files, **(extra_files or {})}
    manifest = {
        "batch_id": result.batch_id,
        "extracted_at": result.extracted_at.isoformat(),
        "cutoff": result.cutoff.isoformat(),
        "files": files,
        "watermarks": {k: v.isoformat() for k, v in result.watermarks.items()},
        "source_counts": result.source_counts,
        "scoresheets_sha256": scoresheets_sha256,
        "columns": {t: [f.name for f in RAW_SCHEMAS[t]] for t in files},
    }
    lake.write_manifest(manifest)
    write_watermarks(conn, result.watermarks, result.batch_id)
    emit(
        "extract_complete",
        batch_id=result.batch_id,
        tables=len(files),
        rows=sum(f["rows"] for f in files.values()),
        cutoff=result.cutoff.isoformat(),
    )


__all__ = [
    "EXTRACT",
    "META",
    "ExtractResult",
    "extract",
    "finish_batch",
    "read_watermarks",
    "source_counts",
    "write_parquet",
    "write_watermarks",
]
