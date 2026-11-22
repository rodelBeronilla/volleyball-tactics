"""FastAPI application.

Endpoints
---------
GET  /healthz          liveness + database ping (no auth)
POST /v1/sync          the web app's snapshot → Postgres (bearer token)
GET  /v1/summary       active row counts, last batch, pipeline watermarks (bearer token)
GET  /v1/batches       recent sync batches with rejection counts (bearer token)
"""

from __future__ import annotations

import hashlib
import logging
import secrets
from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import Depends, FastAPI, Header, HTTPException, Request, status
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError

from . import __version__
from .config import Settings
from .db import make_pool
from .normalize import normalize
from .schemas import SummaryResponse, SyncPayload, SyncResponse
from .sync import apply_sync, last_batch, table_summary, watermarks

log = logging.getLogger("vt_api")


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or Settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        pool = make_pool(settings.database_url, settings.pool_min_size, settings.pool_max_size)
        pool.open(wait=True, timeout=30)
        app.state.pool = pool
        try:
            yield
        finally:
            pool.close()

    app = FastAPI(
        title="Volleyball Tactics API",
        version=__version__,
        description="Operational system of record for the coaching app. Receives snapshots, keeps history.",
        lifespan=lifespan,
    )
    app.state.settings = settings
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
        max_age=600,
    )

    def require_token(authorization: Annotated[str | None, Header()] = None) -> None:
        if not settings.sync_token:
            raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Sync is disabled: SYNC_TOKEN is not configured")
        scheme, _, token = (authorization or "").partition(" ")
        if scheme.lower() != "bearer" or not secrets.compare_digest(token.strip(), settings.sync_token):
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or missing bearer token")

    auth = Depends(require_token)

    @app.get("/healthz", tags=["ops"])
    def healthz(request: Request) -> dict[str, str]:
        try:
            with request.app.state.pool.connection() as conn:
                conn.execute("SELECT 1")
        except Exception as exc:  # pragma: no cover - exercised only when the DB is down
            log.exception("database ping failed")
            raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "database unavailable") from exc
        return {"status": "ok", "version": __version__}

    @app.post("/v1/sync", response_model=SyncResponse, response_model_by_alias=True, dependencies=[auth], tags=["sync"])
    async def sync(request: Request) -> SyncResponse:
        limit = settings.max_payload_mb * 1024 * 1024
        declared = request.headers.get("content-length")
        if declared and declared.isdigit() and int(declared) > limit:
            raise HTTPException(
                status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, f"payload exceeds {settings.max_payload_mb} MB"
            )
        body = await request.body()
        if len(body) > limit:
            raise HTTPException(
                status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, f"payload exceeds {settings.max_payload_mb} MB"
            )
        try:
            payload = SyncPayload.model_validate_json(body)
        except ValidationError as exc:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_CONTENT, exc.errors(include_url=False, include_input=False)
            ) from exc

        normalized = await run_in_threadpool(normalize, payload)
        sha = hashlib.sha256(body).hexdigest()

        def _apply():
            with request.app.state.pool.connection() as conn:
                return apply_sync(
                    conn,
                    normalized,
                    client_id=payload.client_id,
                    app_version=payload.app_version,
                    payload_sha256=sha,
                )

        result = await run_in_threadpool(_apply)
        log.info(
            "sync batch=%s client=%s changes=%s rejected=%d in %dms",
            result.batch_id,
            payload.client_id,
            result.changes,
            len(normalized.rejections),
            result.duration_ms,
        )
        return SyncResponse(
            batchId=result.batch_id,
            receivedAt=result.received_at,
            durationMs=result.duration_ms,
            counts=normalized.counts,
            changes=result.changes,  # type: ignore[arg-type]
            rejected=[{"table": r.table, "id": r.row_id, "reason": r.reason} for r in normalized.rejections],  # type: ignore[list-item]
            warnings=normalized.warnings,
        )

    @app.get(
        "/v1/summary", response_model=SummaryResponse, response_model_by_alias=True, dependencies=[auth], tags=["ops"]
    )
    def summary(request: Request) -> SummaryResponse:
        with request.app.state.pool.connection() as conn:
            return SummaryResponse(
                tables=table_summary(conn),  # type: ignore[arg-type]
                lastBatch=last_batch(conn),
                watermarks=watermarks(conn),
            )

    @app.get("/v1/batches", dependencies=[auth], tags=["ops"])
    def batches(request: Request, limit: int = 20) -> list[dict]:
        limit = max(1, min(limit, 200))
        with request.app.state.pool.connection() as conn:
            rows = conn.execute(
                """
                SELECT b.id, b.client_id, b.app_version, b.received_at, b.row_counts, b.changes,
                       b.rejected_count, b.duration_ms,
                       coalesce(json_agg(json_build_object('table', r.table_name, 'id', r.row_id, 'reason', r.reason))
                                FILTER (WHERE r.batch_id IS NOT NULL), '[]'::json) AS rejections
                  FROM sync_batches b
                  LEFT JOIN sync_rejections r ON r.batch_id = b.id
                 GROUP BY b.id
                 ORDER BY b.received_at DESC
                 LIMIT %s
                """,
                (limit,),
            ).fetchall()
        return [
            {
                "batchId": str(r["id"]),
                "clientId": r["client_id"],
                "appVersion": r["app_version"],
                "receivedAt": r["received_at"].isoformat(),
                "counts": r["row_counts"],
                "changes": r["changes"],
                "rejectedCount": r["rejected_count"],
                "rejections": r["rejections"],
                "durationMs": r["duration_ms"],
            }
            for r in rows
        ]

    return app


app = create_app()
