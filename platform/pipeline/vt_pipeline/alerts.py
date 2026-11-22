"""Alerting.

Every alert is a structured log event (Cloud Monitoring alerts on those) and,
when ``ALERT_WEBHOOK_URL`` is set, a JSON POST with a Slack-compatible ``text``
field, which also suits n8n, Discord or a plain HTTP endpoint on the server.
"""

from __future__ import annotations

from typing import Any

import httpx

from .events import emit


def send_alert(webhook_url: str | None, title: str, severity: str = "ERROR", **details: Any) -> None:
    emit("alert", severity=severity, title=title, **details)
    if not webhook_url:
        return
    lines = [f"*{title}*"] + [f"- {k}: {v}" for k, v in details.items()]
    try:
        httpx.post(webhook_url, json={"text": "\n".join(lines), "severity": severity, **details}, timeout=10)
    except httpx.HTTPError as exc:  # alerting must never take the pipeline down
        emit("alert_delivery_failed", severity="WARNING", error=str(exc))
