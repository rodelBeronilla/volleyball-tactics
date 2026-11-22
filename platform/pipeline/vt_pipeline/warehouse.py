"""Warehouse adapters.

SQL models and checks are written once, in BigQuery's dialect, with table references
as ``{{ layer.table }}`` tokens. ``render()`` resolves the tokens for the target and,
for DuckDB, transpiles the statement with sqlglot. That keeps one copy of the SQL,
tested end to end on every CI run against DuckDB, and deployed unchanged to BigQuery.
"""

from __future__ import annotations

import json
import re
from abc import ABC, abstractmethod
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import pyarrow as pa

from .config import PipelineSettings
from .schemas import RAW_KEYS, RAW_SCHEMAS

LAYERS = ("raw", "staging", "marts")
_TOKEN = re.compile(r"\{\{\s*(raw|staging|marts)\.(\w+)\s*\}\}")
_PARAM = re.compile(r"\{\{\s*(\w+)\s*\}\}")

# Bookkeeping tables (BigQuery-style column types; adapters translate).
ETL_LOADS = {
    "batch_id": "STRING",
    "table_name": "STRING",
    "uri": "STRING",
    "row_count": "INT64",
    "loaded_at": "TIMESTAMP",
}
ETL_BATCHES = {
    "batch_id": "STRING",
    "extracted_at": "TIMESTAMP",
    "loaded_at": "TIMESTAMP",
    "source_counts": "STRING",
    "manifest": "STRING",
}
ETL_RUNS = {
    "run_id": "STRING",
    "started_at": "TIMESTAMP",
    "finished_at": "TIMESTAMP",
    "target": "STRING",
    "stages": "STRING",
    "status": "STRING",
    "details": "STRING",
}
DQ_RESULTS = {
    "run_id": "STRING",
    "checked_at": "TIMESTAMP",
    "check_name": "STRING",
    "severity": "STRING",
    "description": "STRING",
    "violations": "INT64",
    "passed": "BOOL",
    "sample": "STRING",
}
RECONCILIATION_COUNTS = {
    "run_id": "STRING",
    "checked_at": "TIMESTAMP",
    "batch_id": "STRING",
    "table_name": "STRING",
    "source_rows": "INT64",
    "warehouse_rows": "INT64",
    "difference": "INT64",
    "status": "STRING",
}


class Warehouse(ABC):
    dialect: str

    def __init__(self, params: dict[str, Any] | None = None):
        self.params = {k: str(v) for k, v in (params or {}).items()}

    # Rendering -------------------------------------------------------------------

    def render(self, template: str) -> str:
        sql = _TOKEN.sub(lambda m: self.ref(m.group(1), m.group(2)), template)

        def param(m: re.Match) -> str:
            key = m.group(1)
            if key not in self.params:
                raise KeyError(f"unknown template parameter {{{{ {key} }}}}")
            return self.params[key]

        sql = _PARAM.sub(param, sql)
        return self.transpile(sql)

    def transpile(self, sql: str) -> str:
        return sql

    # Abstract surface --------------------------------------------------------------

    @abstractmethod
    def ref(self, layer: str, table: str) -> str: ...

    @abstractmethod
    def execute(self, sql: str) -> None: ...

    @abstractmethod
    def query(self, sql: str) -> list[dict[str, Any]]: ...

    @abstractmethod
    def ensure_layers(self) -> None:
        """Create schemas/datasets, empty raw tables for every known source table, bookkeeping tables."""

    @abstractmethod
    def load_parquet(self, table: str, uri: str) -> int: ...

    @abstractmethod
    def create_table_as(
        self,
        layer: str,
        name: str,
        select_sql: str,
        *,
        partition_by: str | None = None,
        cluster_by: list[str] | None = None,
        description: str | None = None,
    ) -> None: ...

    @abstractmethod
    def ensure_table(self, layer: str, name: str, columns: dict[str, str]) -> None: ...

    @abstractmethod
    def insert_rows(self, layer: str, name: str, rows: list[dict[str, Any]]) -> None: ...

    def close(self) -> None:  # noqa: B027 - adapters without a connection need nothing here
        return None

    # Shared helpers ----------------------------------------------------------------

    def ensure_bookkeeping(self) -> None:
        self.ensure_table("raw", "etl_loads", ETL_LOADS)
        self.ensure_table("raw", "etl_batches", ETL_BATCHES)
        self.ensure_table("marts", "etl_runs", ETL_RUNS)
        self.ensure_table("marts", "dq_check_results", DQ_RESULTS)
        self.ensure_table("marts", "reconciliation_source_counts", RECONCILIATION_COUNTS)

    def loaded_batches(self) -> set[str]:
        rows = self.query(f"SELECT DISTINCT batch_id FROM {self.ref('raw', 'etl_batches')}")
        return {r["batch_id"] for r in rows}

    def record_batch(self, manifest: dict[str, Any], loads: list[dict[str, Any]]) -> None:
        now = datetime.now(UTC)
        self.insert_rows("raw", "etl_loads", [{**ld, "loaded_at": now} for ld in loads])
        self.insert_rows(
            "raw",
            "etl_batches",
            [
                {
                    "batch_id": manifest["batch_id"],
                    "extracted_at": datetime.fromisoformat(manifest["extracted_at"]),
                    "loaded_at": now,
                    "source_counts": json.dumps(manifest.get("source_counts", {})),
                    "manifest": json.dumps(manifest, default=str),
                }
            ],
        )

    def latest_batch(self) -> dict[str, Any] | None:
        rows = self.query(
            f"SELECT batch_id, extracted_at, source_counts FROM {self.ref('raw', 'etl_batches')} "
            "ORDER BY extracted_at DESC, batch_id DESC LIMIT 1"
        )
        if not rows:
            return None
        row = rows[0]
        row["source_counts"] = json.loads(row["source_counts"] or "{}")
        return row


# ── DuckDB ──────────────────────────────────────────────────────────────────────

_DUCK_TYPES = {
    "STRING": "VARCHAR",
    "INT64": "BIGINT",
    "FLOAT64": "DOUBLE",
    "BOOL": "BOOLEAN",
    "TIMESTAMP": "TIMESTAMPTZ",
    "DATE": "DATE",
}


class DuckDBWarehouse(Warehouse):
    dialect = "duckdb"

    def __init__(self, path: Path, params: dict[str, Any] | None = None):
        super().__init__(params)
        import duckdb

        Path(path).parent.mkdir(parents=True, exist_ok=True)
        self.path = Path(path)
        self.conn = duckdb.connect(str(self.path))
        self.conn.execute("SET TimeZone = 'UTC'")

    def ref(self, layer: str, table: str) -> str:
        return f"{layer}.{table}"

    def transpile(self, sql: str) -> str:
        import sqlglot

        return sqlglot.transpile(sql, read="bigquery", write="duckdb", pretty=True)[0]

    def execute(self, sql: str) -> None:
        self.conn.execute(sql)

    def query(self, sql: str) -> list[dict[str, Any]]:
        cur = self.conn.execute(sql)
        cols = [d[0] for d in cur.description]
        return [dict(zip(cols, row, strict=True)) for row in cur.fetchall()]

    def ensure_layers(self) -> None:
        for layer in LAYERS:
            self.conn.execute(f"CREATE SCHEMA IF NOT EXISTS {layer}")
        for table, schema in RAW_SCHEMAS.items():
            empty = pa.Table.from_pylist([], schema=schema)
            self.conn.register("_empty", empty)
            self.conn.execute(f"CREATE TABLE IF NOT EXISTS raw.{table} AS SELECT * FROM _empty")
            self.conn.unregister("_empty")
        self.ensure_bookkeeping()

    def load_parquet(self, table: str, uri: str) -> int:
        self.conn.execute(
            f"INSERT INTO raw.{table} BY NAME SELECT * FROM read_parquet(?, hive_partitioning = false)", [uri]
        )
        return self.conn.execute("SELECT count(*) FROM read_parquet(?, hive_partitioning = false)", [uri]).fetchone()[0]

    def create_table_as(self, layer, name, select_sql, *, partition_by=None, cluster_by=None, description=None):
        self.conn.execute(f"CREATE OR REPLACE TABLE {layer}.{name} AS\n{select_sql}")
        if description:
            literal = description.replace("'", "''")
            self.conn.execute(f"COMMENT ON TABLE {layer}.{name} IS '{literal}'")

    def ensure_table(self, layer, name, columns):
        cols = ", ".join(f"{c} {_DUCK_TYPES[t]}" for c, t in columns.items())
        self.conn.execute(f"CREATE TABLE IF NOT EXISTS {layer}.{name} ({cols})")

    def insert_rows(self, layer, name, rows):
        if not rows:
            return
        cols = list(rows[0].keys())
        placeholders = ", ".join("?" for _ in cols)
        self.conn.executemany(
            f"INSERT INTO {layer}.{name} ({', '.join(cols)}) VALUES ({placeholders})",
            [[r.get(c) for c in cols] for r in rows],
        )

    def close(self) -> None:
        self.conn.close()


# ── BigQuery ────────────────────────────────────────────────────────────────────


def _arrow_to_bq(dtype: pa.DataType) -> str:
    if pa.types.is_string(dtype):
        return "STRING"
    if pa.types.is_integer(dtype):
        return "INT64"
    if pa.types.is_floating(dtype):
        return "FLOAT64"
    if pa.types.is_boolean(dtype):
        return "BOOL"
    if pa.types.is_timestamp(dtype):
        return "TIMESTAMP"
    if pa.types.is_date(dtype):
        return "DATE"
    raise TypeError(f"no BigQuery mapping for {dtype}")


class BigQueryWarehouse(Warehouse):
    """BigQuery. Raw tables are day-partitioned on ``_extracted_at`` and clustered on their natural key."""

    dialect = "bigquery"

    def __init__(self, settings: PipelineSettings, params: dict[str, Any] | None = None):
        super().__init__(params)
        from google.cloud import bigquery  # type: ignore[import-not-found]

        if not settings.gcp_project:
            raise SystemExit("GCP_PROJECT is required for the gcp target")
        self.bq = bigquery
        self.client = bigquery.Client(project=settings.gcp_project, location=settings.bq_location)
        self.project = settings.gcp_project
        self.location = settings.bq_location
        self.datasets = {
            "raw": settings.bq_dataset_raw,
            "staging": settings.bq_dataset_staging,
            "marts": settings.bq_dataset_marts,
        }

    def ref(self, layer: str, table: str) -> str:
        return f"`{self.project}.{self.datasets[layer]}.{table}`"

    def _table_id(self, layer: str, table: str) -> str:
        return f"{self.project}.{self.datasets[layer]}.{table}"

    def execute(self, sql: str) -> None:
        self.client.query(sql).result()

    def query(self, sql: str) -> list[dict[str, Any]]:
        return [dict(row.items()) for row in self.client.query(sql).result()]

    def ensure_layers(self) -> None:
        for layer in LAYERS:
            ds = self.bq.Dataset(f"{self.project}.{self.datasets[layer]}")
            ds.location = self.location
            self.client.create_dataset(ds, exists_ok=True)
        for table, schema in RAW_SCHEMAS.items():
            t = self.bq.Table(
                self._table_id("raw", table),
                schema=[self.bq.SchemaField(f.name, _arrow_to_bq(f.type)) for f in schema],
            )
            t.time_partitioning = self.bq.TimePartitioning(
                type_=self.bq.TimePartitioningType.DAY, field="_extracted_at"
            )
            t.clustering_fields = RAW_KEYS.get(table)
            self.client.create_table(t, exists_ok=True)
        self.ensure_bookkeeping()

    def load_parquet(self, table: str, uri: str) -> int:
        config = self.bq.LoadJobConfig(
            source_format=self.bq.SourceFormat.PARQUET,
            write_disposition=self.bq.WriteDisposition.WRITE_APPEND,
            schema_update_options=[self.bq.SchemaUpdateOption.ALLOW_FIELD_ADDITION],
        )
        job = self.client.load_table_from_uri(uri, self._table_id("raw", table), job_config=config)
        job.result()
        return int(job.output_rows or 0)

    def create_table_as(self, layer, name, select_sql, *, partition_by=None, cluster_by=None, description=None):
        clauses = []
        if partition_by:
            clauses.append(f"PARTITION BY {partition_by}")
        if cluster_by:
            clauses.append(f"CLUSTER BY {', '.join(cluster_by)}")
        if description:
            clauses.append("OPTIONS (description = " + json.dumps(description) + ")")
        self.execute(f"CREATE OR REPLACE TABLE {self.ref(layer, name)}\n{' '.join(clauses)}\nAS\n{select_sql}")

    def ensure_table(self, layer, name, columns):
        cols = ", ".join(f"{c} {t}" for c, t in columns.items())
        self.execute(f"CREATE TABLE IF NOT EXISTS {self.ref(layer, name)} ({cols})")

    def insert_rows(self, layer, name, rows):
        if not rows:
            return
        # A load job rather than the streaming API: free, and immediately queryable.
        payload = [{k: (v.isoformat() if isinstance(v, datetime) else v) for k, v in r.items()} for r in rows]
        config = self.bq.LoadJobConfig(write_disposition=self.bq.WriteDisposition.WRITE_APPEND)
        self.client.load_table_from_json(payload, self._table_id(layer, name), job_config=config).result()


def make_warehouse(settings: PipelineSettings) -> Warehouse:
    params = {"freshness_hours": settings.freshness_hours}
    if settings.pipeline_target == "gcp":
        return BigQueryWarehouse(settings, params)
    return DuckDBWarehouse(settings.duckdb_file, params)
