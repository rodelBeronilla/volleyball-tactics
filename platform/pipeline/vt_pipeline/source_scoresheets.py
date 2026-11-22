"""Third-party source: official league scoresheets as CSV files.

Two file kinds live in ``SCORESHEETS_DIR`` (a folder, or a ``gs://bucket/prefix``):

``*.sets.csv``     match_date, opponent, set_number, our_score, their_score
``*.players.csv``  match_date, opponent, player_number, player_name, kills, aces, blocks, digs, assists

Every row is validated; bad rows are reported (``scoresheet_row_rejected`` events and a
count in the batch manifest) and skipped, never guessed at. All files are re-read on
every run - a season's scoresheets are a few kilobytes - and staging keeps only the
latest copy of each file, so correcting a CSV and re-running is the whole workflow.
"""

from __future__ import annotations

import csv
import hashlib
import io
import tempfile
from dataclasses import dataclass, field
from datetime import date, datetime
from pathlib import Path
from typing import Any

from .events import emit
from .lake import Lake
from .source_postgres import write_parquet

SETS_COLUMNS = ["match_date", "opponent", "set_number", "our_score", "their_score"]
PLAYER_COLUMNS = [
    "match_date",
    "opponent",
    "player_number",
    "player_name",
    "kills",
    "aces",
    "blocks",
    "digs",
    "assists",
]
PLAYER_INT_COLUMNS = ["player_number", "kills", "aces", "blocks", "digs", "assists"]


class ScoresheetRowError(ValueError):
    pass


@dataclass
class ScoresheetBatch:
    sets: list[dict[str, Any]] = field(default_factory=list)
    player_lines: list[dict[str, Any]] = field(default_factory=list)
    rejected: list[dict[str, Any]] = field(default_factory=list)
    files: list[str] = field(default_factory=list)


def _date(v: str) -> date:
    try:
        return date.fromisoformat(v.strip()[:10])
    except ValueError as exc:
        raise ScoresheetRowError(f"invalid match_date {v!r}") from exc


def _int(v: str, what: str, lo: int = 0) -> int:
    try:
        n = int(str(v).strip())
    except ValueError as exc:
        raise ScoresheetRowError(f"invalid {what} {v!r}") from exc
    if n < lo:
        raise ScoresheetRowError(f"{what} below {lo}: {n}")
    return n


def _opt_int(v: str | None, what: str) -> int | None:
    if v is None or str(v).strip() == "":
        return None
    return _int(v, what)


def parse_sets(text: str, source_file: str) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    rows, rejected = [], []
    reader = csv.DictReader(io.StringIO(text))
    missing = [c for c in SETS_COLUMNS if c not in (reader.fieldnames or [])]
    if missing:
        return [], [{"source_file": source_file, "row_number": 0, "reason": f"missing columns {missing}"}]
    for i, raw in enumerate(reader, start=2):
        try:
            rows.append(
                {
                    "source_file": source_file,
                    "row_number": i,
                    "match_date": _date(raw["match_date"]),
                    "opponent": (raw["opponent"] or "").strip() or _fail("empty opponent"),
                    "set_number": _int(raw["set_number"], "set_number", lo=1),
                    "our_score": _int(raw["our_score"], "our_score"),
                    "their_score": _int(raw["their_score"], "their_score"),
                }
            )
        except ScoresheetRowError as exc:
            rejected.append({"source_file": source_file, "row_number": i, "reason": str(exc)})
    return rows, rejected


def parse_player_lines(text: str, source_file: str) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    rows, rejected = [], []
    reader = csv.DictReader(io.StringIO(text))
    missing = [c for c in PLAYER_COLUMNS if c not in (reader.fieldnames or [])]
    if missing:
        return [], [{"source_file": source_file, "row_number": 0, "reason": f"missing columns {missing}"}]
    for i, raw in enumerate(reader, start=2):
        try:
            row = {
                "source_file": source_file,
                "row_number": i,
                "match_date": _date(raw["match_date"]),
                "opponent": (raw["opponent"] or "").strip() or _fail("empty opponent"),
                "player_name": (raw.get("player_name") or "").strip() or None,
            }
            for c in PLAYER_INT_COLUMNS:
                row[c] = _opt_int(raw.get(c), c)
            if row["player_number"] is None:
                raise ScoresheetRowError("missing player_number")
            rows.append(row)
        except ScoresheetRowError as exc:
            rejected.append({"source_file": source_file, "row_number": i, "reason": str(exc)})
    return rows, rejected


def _fail(reason: str):
    raise ScoresheetRowError(reason)


def _read_sources(location: str) -> list[tuple[str, str]]:
    """(file name, text) for every CSV under a folder or gs:// prefix."""
    if location.startswith("gs://"):
        from google.cloud import storage  # type: ignore[import-not-found]

        bucket, _, prefix = location[5:].partition("/")
        client = storage.Client()
        out = []
        for blob in client.list_blobs(bucket, prefix=prefix):
            if blob.name.endswith(".csv"):
                out.append((Path(blob.name).name, blob.download_as_text()))
        return sorted(out)
    folder = Path(location)
    if not folder.exists():
        return []
    return sorted((p.name, p.read_text(encoding="utf-8-sig")) for p in folder.glob("*.csv"))


def collect(location: str) -> ScoresheetBatch:
    batch = ScoresheetBatch()
    for name, text in _read_sources(location):
        if name.endswith(".sets.csv"):
            rows, rejected = parse_sets(text, name)
            batch.sets.extend(rows)
        elif name.endswith(".players.csv"):
            rows, rejected = parse_player_lines(text, name)
            batch.player_lines.extend(rows)
        else:
            emit(
                "scoresheet_file_ignored",
                severity="WARNING",
                file=name,
                reason="name must end in .sets.csv or .players.csv",
            )
            continue
        batch.files.append(name)
        batch.rejected.extend(rejected)
        for r in rejected:
            emit("scoresheet_row_rejected", severity="WARNING", **r)
    return batch


def extract_scoresheets(
    location: str,
    lake: Lake,
    batch_id: str,
    extracted_at: datetime,
    previous_sha256: str | None = None,
) -> tuple[dict[str, dict[str, Any]], list[dict[str, Any]], str | None]:
    """Write the scoresheet tables for this batch.

    Returns ({table: {uri, rows}}, rejected rows, content hash). When the CSVs are byte-for-byte
    what the previous batch already carried, nothing is written and the hash is returned unchanged.
    """
    sources = _read_sources(location)
    if not sources:
        return {}, [], None
    digest = hashlib.sha256()
    for name, text in sources:
        digest.update(name.encode("utf-8"))
        digest.update(text.encode("utf-8"))
    sha = digest.hexdigest()
    if sha == previous_sha256:
        emit("scoresheets_unchanged", files=[n for n, _ in sources])
        return {}, [], sha
    batch = collect(location)
    files: dict[str, dict[str, Any]] = {}
    if not batch.files:
        return files, [], sha
    tmpdir = Path(tempfile.mkdtemp(prefix="vt-scoresheets-"))
    for table, rows in (("scoresheet_sets", batch.sets), ("scoresheet_player_lines", batch.player_lines)):
        dest = tmpdir / f"{table}.parquet"
        n, _ = write_parquet(iter([rows]), table, batch_id, extracted_at, "scoresheet_csv", dest)
        uri = lake.put_file(dest, f"raw/{table}/dt={extracted_at:%Y-%m-%d}/{batch_id}.parquet")
        files[table] = {"uri": uri, "rows": n, "source": "scoresheet_csv", "source_files": batch.files}
        emit("extract_table", table=table, rows=n, batch_id=batch_id, source="scoresheet_csv")
    return files, batch.rejected, sha
