"""Arrow schemas of every raw table.

Explicit schemas keep Parquet files stable even when a column is all-NULL in a batch
(Arrow would otherwise infer ``null`` and BigQuery would refuse the load), and they are
the single place the warehouse learns the shape of raw tables from.
"""

from __future__ import annotations

import pyarrow as pa

STR = pa.string()
INT = pa.int64()
FLOAT = pa.float64()
BOOL = pa.bool_()
TS = pa.timestamp("us", tz="UTC")
DATE = pa.date32()

_AUDIT = [("client_id", STR), ("created_at", TS), ("updated_at", TS), ("deleted_at", TS)]
META = [("_batch_id", STR), ("_extracted_at", TS), ("_source", STR)]

_COLUMNS: dict[str, list[tuple[str, pa.DataType]]] = {
    "stat_types": [("stat", STR), ("label", STR), ("stat_group", STR), ("positive", BOOL), ("attribute", STR)],
    "players": [
        ("id", STR),
        ("name", STR),
        ("number", INT),
        ("position", STR),
        ("base_ratings", STR),
        ("archetype", STR),
        ("rating_history", STR),
        *_AUDIT,
    ],
    "lineups": [("id", STR), ("name", STR), ("system", STR), ("libero_id", STR), ("overrides", STR), *_AUDIT],
    "lineup_slots": [("lineup_id", STR), ("slot", INT), ("player_id", STR)],
    "matches": [
        ("id", STR),
        ("opponent", STR),
        ("match_date", DATE),
        ("lineup_id", STR),
        ("completed", BOOL),
        ("night_plan_set_ref", STR),
        *_AUDIT,
    ],
    "match_sets": [("match_id", STR), ("set_number", INT), ("our_score", INT), ("their_score", INT), ("won", BOOL)],
    "rallies": [
        ("id", STR),
        ("match_id", STR),
        ("set_number", INT),
        ("rally_number", INT),
        ("rotation", INT),
        ("serving_team", STR),
        ("our_score_before", INT),
        ("their_score_before", INT),
        ("outcome", STR),
        *_AUDIT,
    ],
    "rally_actions": [("rally_id", STR), ("action_order", INT), ("player_id", STR), ("stat", STR)],
    "stat_events": [
        ("id", STR),
        ("match_id", STR),
        ("set_number", INT),
        ("rally_id", STR),
        ("player_id", STR),
        ("is_team_event", BOOL),
        ("rotation", INT),
        ("stat", STR),
        ("serving_team", STR),
        ("event_ts", TS),
        ("video_ts", FLOAT),
        *_AUDIT,
    ],
    "stat_event_summaries": [
        ("id", STR),
        ("match_id", STR),
        ("player_id", STR),
        ("rotation", INT),
        ("set_numbers", STR),
        *_AUDIT,
    ],
    "stat_event_summary_sets": [("summary_id", STR), ("set_number", INT)],
    "stat_event_summary_counts": [("summary_id", STR), ("stat", STR), ("n", INT)],
    "night_plans": [("id", STR), ("name", STR), ("plan_date", DATE), ("plan", STR), *_AUDIT],
    # Third-party source: official league scoresheets, delivered as CSV.
    "scoresheet_sets": [
        ("source_file", STR),
        ("row_number", INT),
        ("match_date", DATE),
        ("opponent", STR),
        ("set_number", INT),
        ("our_score", INT),
        ("their_score", INT),
    ],
    "scoresheet_player_lines": [
        ("source_file", STR),
        ("row_number", INT),
        ("match_date", DATE),
        ("opponent", STR),
        ("player_number", INT),
        ("player_name", STR),
        ("kills", INT),
        ("aces", INT),
        ("blocks", INT),
        ("digs", INT),
        ("assists", INT),
    ],
}

RAW_SCHEMAS: dict[str, pa.Schema] = {name: pa.schema([*cols, *META]) for name, cols in _COLUMNS.items()}

# Natural keys, used for BigQuery clustering and by the row-count reconciliation.
RAW_KEYS: dict[str, list[str]] = {
    "stat_types": ["stat"],
    "players": ["id"],
    "lineups": ["id"],
    "lineup_slots": ["lineup_id"],
    "matches": ["id"],
    "match_sets": ["match_id"],
    "rallies": ["match_id", "id"],
    "rally_actions": ["rally_id"],
    "stat_events": ["match_id", "player_id"],
    "stat_event_summaries": ["id"],
    "stat_event_summary_sets": ["summary_id"],
    "stat_event_summary_counts": ["summary_id"],
    "night_plans": ["id"],
    "scoresheet_sets": ["match_date"],
    "scoresheet_player_lines": ["match_date"],
}

# Parent tables that carry updated_at and therefore a watermark; children ride on them.
WATERMARKED = ("players", "lineups", "matches", "rallies", "stat_events", "stat_event_summaries", "night_plans")
