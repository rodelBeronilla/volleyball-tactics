"""The five stages, each runnable on its own.

extract   → source Postgres (+ scoresheet CSVs) → Parquet in the lake, one batch manifest
load      → every batch not yet in raw.etl_batches → raw tables (append)
transform → staging and marts models, in dependency order
check     → data-quality checks → marts.dq_check_results (+ alerts)
reconcile → source counts (from the latest manifest) vs warehouse; scoresheet vs app results

`run` is the five in order. On the server, `extract` runs next to Postgres; the other
four can run there too (local target) or in a Cloud Run job next to BigQuery.
"""

from __future__ import annotations

import json
import secrets
import time
from datetime import UTC, datetime
from typing import Any

from .alerts import send_alert
from .checks import CheckReport, run_checks
from .config import PipelineSettings
from .events import emit
from .lake import make_lake
from .models import Registry
from .schemas import WATERMARKED
from .warehouse import Warehouse, make_warehouse


class PipelineFailed(RuntimeError):
    pass


def new_run_id() -> str:
    return f"{datetime.now(UTC):%Y%m%dT%H%M%S}Z-{secrets.token_hex(3)}"


# ── extract ──────────────────────────────────────────────────────────────────


def stage_extract(settings: PipelineSettings) -> str | None:
    import psycopg

    from .source_postgres import extract, finish_batch, write_watermarks
    from .source_scoresheets import extract_scoresheets

    if not settings.database_url:
        raise SystemExit("DATABASE_URL is required for extract")
    lake = make_lake(settings)
    with psycopg.connect(settings.database_url) as conn:
        result = extract(conn, lake, lag_seconds=settings.extract_lag_seconds)
        extra: dict[str, dict[str, Any]] = {}
        previous = lake.manifests()
        sheet_sha = previous[-1].get("scoresheets_sha256") if previous else None
        if settings.scoresheets_dir:
            extra, rejected, sheet_sha = extract_scoresheets(
                settings.scoresheets_dir, lake, result.batch_id, result.extracted_at, previous_sha256=sheet_sha
            )
            if rejected:
                send_alert(
                    settings.alert_webhook_url,
                    "Scoresheet rows rejected",
                    severity="WARNING",
                    rejected=len(rejected),
                    examples=rejected[:5],
                )
        if result.incremental_rows == 0 and not extra:
            write_watermarks(conn, result.watermarks, None)
            emit("extract_nothing_new", cutoff=result.cutoff.isoformat())
            return None
        finish_batch(conn, lake, result, extra, scoresheets_sha256=sheet_sha)
    return result.batch_id


# ── load ─────────────────────────────────────────────────────────────────────


def stage_load(settings: PipelineSettings, wh: Warehouse | None = None) -> list[str]:
    lake = make_lake(settings)
    own = wh is None
    wh = wh or make_warehouse(settings)
    try:
        wh.ensure_layers()
        done = wh.loaded_batches()
        loaded = []
        for manifest in lake.manifests():
            if manifest["batch_id"] in done:
                continue
            loads = []
            for table, info in manifest["files"].items():
                rows = wh.load_parquet(table, info["uri"])
                loads.append(
                    {"batch_id": manifest["batch_id"], "table_name": table, "uri": info["uri"], "row_count": rows}
                )
                emit("load_table", batch_id=manifest["batch_id"], table=table, rows=rows)
            wh.record_batch(manifest, loads)
            loaded.append(manifest["batch_id"])
            emit("load_batch_complete", batch_id=manifest["batch_id"], tables=len(loads))
        if not loaded:
            emit("load_nothing_new")
        return loaded
    finally:
        if own:
            wh.close()


# ── transform ────────────────────────────────────────────────────────────────


def stage_transform(
    settings: PipelineSettings, wh: Warehouse | None = None, registry: Registry | None = None
) -> list[str]:
    own = wh is None
    wh = wh or make_warehouse(settings)
    registry = registry or Registry()
    built = []
    try:
        wh.ensure_layers()
        for model in registry.models:
            started = time.perf_counter()
            wh.create_table_as(
                model.layer,
                model.name,
                wh.render(model.sql),
                partition_by=model.partition_by,
                cluster_by=list(model.cluster_by) or None,
                description=model.description or None,
            )
            rows = wh.query(f"SELECT COUNT(*) AS n FROM {wh.ref(model.layer, model.name)}")[0]["n"]
            emit(
                "model_built",
                model=f"{model.layer}.{model.name}",
                rows=rows,
                ms=int((time.perf_counter() - started) * 1000),
            )
            built.append(f"{model.layer}.{model.name}")
        return built
    finally:
        if own:
            wh.close()


# ── check ────────────────────────────────────────────────────────────────────


def stage_check(
    settings: PipelineSettings, wh: Warehouse | None = None, registry: Registry | None = None, run_id: str | None = None
) -> CheckReport:
    own = wh is None
    wh = wh or make_warehouse(settings)
    registry = registry or Registry()
    run_id = run_id or new_run_id()
    try:
        wh.ensure_bookkeeping()
        report = run_checks(wh, registry.checks, run_id)
        summary = report.summary()
        emit("checks_complete", run_id=run_id, **summary)
        if report.failed_errors or report.failed_warnings:
            send_alert(
                settings.alert_webhook_url,
                "Data quality checks failed" if report.failed_errors else "Data quality warnings",
                severity="ERROR" if report.failed_errors else "WARNING",
                run_id=run_id,
                errors=summary["errors"],
                warnings=summary["warnings"],
            )
        return report
    finally:
        if own:
            wh.close()


# ── reconcile ────────────────────────────────────────────────────────────────


def stage_reconcile(
    settings: PipelineSettings, wh: Warehouse | None = None, run_id: str | None = None
) -> dict[str, Any]:
    """Compare the source's own row counts (captured at extraction) with what the warehouse serves,
    and summarise the scoresheet reconciliation tables built by the transform stage."""
    own = wh is None
    wh = wh or make_warehouse(settings)
    run_id = run_id or new_run_id()
    try:
        wh.ensure_bookkeeping()
        result: dict[str, Any] = {"run_id": run_id}
        latest = wh.latest_batch()
        rows_out = []
        if latest:
            checked_at = datetime.now(UTC)
            for table in WATERMARKED:
                src = latest["source_counts"].get(table)
                if src is None:
                    continue
                stg = f"stg_{table}"
                whs = wh.query(f"SELECT COUNT(*) AS n FROM {wh.ref('staging', stg)} WHERE NOT is_deleted")[0]["n"]
                diff = int(whs) - int(src)
                rows_out.append(
                    {
                        "run_id": run_id,
                        "checked_at": checked_at,
                        "batch_id": latest["batch_id"],
                        "table_name": table,
                        "source_rows": int(src),
                        "warehouse_rows": int(whs),
                        "difference": diff,
                        "status": "match" if diff == 0 else "mismatch",
                    }
                )
            wh.insert_rows("marts", "reconciliation_source_counts", rows_out)
        mismatches = [r for r in rows_out if r["status"] != "match"]
        result["source_counts"] = {"tables": len(rows_out), "mismatches": [r["table_name"] for r in mismatches]}

        def status_counts(table: str) -> dict[str, int]:
            try:
                rows = wh.query(f"SELECT status, COUNT(*) AS n FROM {wh.ref('marts', table)} GROUP BY status")
            except Exception:  # table not built yet (no transform run)
                return {}
            return {r["status"]: int(r["n"]) for r in rows}

        result["scoresheet_sets"] = status_counts("rec_scoresheet_sets")
        result["scoresheet_players"] = status_counts("rec_scoresheet_players")
        emit("reconcile_complete", **result)

        problems = {k: v for k, v in result["scoresheet_sets"].items() if k != "match" and v}
        if mismatches or problems:
            send_alert(
                settings.alert_webhook_url,
                "Reconciliation found differences",
                severity="WARNING",
                run_id=run_id,
                source_count_mismatches=result["source_counts"]["mismatches"],
                scoresheet_sets=result["scoresheet_sets"],
                scoresheet_players=result["scoresheet_players"],
            )
        return result
    finally:
        if own:
            wh.close()


# ── run ──────────────────────────────────────────────────────────────────────

ALL_STAGES = ("extract", "load", "transform", "check", "reconcile")


def run(settings: PipelineSettings, stages: tuple[str, ...] = ALL_STAGES) -> dict[str, Any]:
    run_id = new_run_id()
    started = datetime.now(UTC)
    details: dict[str, Any] = {}
    status = "success"
    emit("run_started", run_id=run_id, target=settings.pipeline_target, stages=list(stages))
    wh: Warehouse | None = None
    try:
        if "extract" in stages:
            details["extract"] = {"batch_id": stage_extract(settings)}
        wh = make_warehouse(settings)
        if "load" in stages:
            details["load"] = {"batches": stage_load(settings, wh)}
        if "transform" in stages:
            details["transform"] = {"models": len(stage_transform(settings, wh))}
        if "check" in stages:
            report = stage_check(settings, wh, run_id=run_id)
            details["check"] = report.summary()
            if not report.ok:
                status = "failed"
        if "reconcile" in stages:
            details["reconcile"] = stage_reconcile(settings, wh, run_id=run_id)
    except Exception as exc:
        status = "error"
        details["error"] = repr(exc)
        send_alert(settings.alert_webhook_url, "Pipeline run crashed", run_id=run_id, error=repr(exc))
        raise
    finally:
        finished = datetime.now(UTC)
        emit(
            "run_finished",
            severity="INFO" if status == "success" else "ERROR",
            run_id=run_id,
            status=status,
            seconds=(finished - started).total_seconds(),
            **details,
        )
        if wh is not None:
            try:
                wh.ensure_bookkeeping()
                wh.insert_rows(
                    "marts",
                    "etl_runs",
                    [
                        {
                            "run_id": run_id,
                            "started_at": started,
                            "finished_at": finished,
                            "target": settings.pipeline_target,
                            "stages": ",".join(stages),
                            "status": status,
                            "details": json.dumps(details, default=str),
                        }
                    ],
                )
            finally:
                wh.close()
    if status == "failed":
        raise PipelineFailed("data quality checks failed: " + ", ".join(details["check"]["errors"]))
    return {"run_id": run_id, "status": status, **details}
