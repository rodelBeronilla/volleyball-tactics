"""Structured logging: one JSON object per line on stdout.

Cloud Logging turns these into ``jsonPayload`` and honours ``severity``; the
Terraform in ``platform/infra/gcp`` builds a log-based metric and an alert on
``jsonPayload.event = "quality_check_failed"``. Locally they are still greppable.
"""

from __future__ import annotations

import json
import sys
from datetime import UTC, datetime
from typing import Any


def emit(event: str, severity: str = "INFO", **fields: Any) -> None:
    record = {
        "severity": severity,
        "event": event,
        "time": datetime.now(UTC).isoformat(timespec="milliseconds"),
        "component": "vt-pipeline",
        **fields,
    }
    print(json.dumps(record, default=str, separators=(",", ":")), file=sys.stdout, flush=True)
