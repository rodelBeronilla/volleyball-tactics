"""SQL model and check registry.

A model is one ``.sql`` file under ``sql/staging`` or ``sql/marts`` holding a SELECT and
a header of ``-- key: value`` lines::

    -- model: fct_stat_events
    -- layer: marts
    -- depends_on: staging.stg_stat_events, marts.dim_matches
    -- partition_by: match_date
    -- cluster_by: player_id, stat
    -- description: One row per recorded touch ...

Checks live under ``sql/checks`` and return the *violating* rows::

    -- check: set_scores_match_rally_outcomes
    -- severity: error
    -- description: ...
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from graphlib import TopologicalSorter
from importlib import resources

_HEADER = re.compile(r"^--\s*([a-z_]+):\s*(.*?)\s*$")


@dataclass(frozen=True)
class Model:
    name: str
    layer: str
    sql: str
    description: str = ""
    depends_on: tuple[str, ...] = ()
    partition_by: str | None = None
    cluster_by: tuple[str, ...] = ()
    source: str = ""


@dataclass(frozen=True)
class Check:
    name: str
    severity: str  # "error" fails the run; "warn" is recorded and alerted but does not fail it
    sql: str
    description: str = ""
    source: str = ""


def _parse(text: str) -> tuple[dict[str, str], str]:
    headers: dict[str, str] = {}
    body: list[str] = []
    in_header = True
    for line in text.splitlines():
        m = _HEADER.match(line) if in_header else None
        if m:
            headers[m.group(1)] = m.group(2)
        else:
            if line.strip() and not line.startswith("--"):
                in_header = False
            body.append(line)
    return headers, "\n".join(body).strip()


def _files(folder: str):
    base = resources.files("vt_pipeline") / "sql" / folder
    return sorted((p for p in base.iterdir() if p.name.endswith(".sql")), key=lambda p: p.name)


def load_models(layers: tuple[str, ...] = ("staging", "marts")) -> list[Model]:
    """Models in dependency order (staging before marts, then by ``depends_on``)."""
    models: dict[str, Model] = {}
    for layer in layers:
        for p in _files(layer):
            headers, sql = _parse(p.read_text(encoding="utf-8"))
            name = headers.get("model", p.name[:-4])
            models[f"{layer}.{name}"] = Model(
                name=name,
                layer=headers.get("layer", layer),
                sql=sql,
                description=headers.get("description", ""),
                depends_on=tuple(d.strip() for d in headers.get("depends_on", "").split(",") if d.strip()),
                partition_by=headers.get("partition_by") or None,
                cluster_by=tuple(c.strip() for c in headers.get("cluster_by", "").split(",") if c.strip()),
                source=p.name,
            )
    graph = {key: {d for d in m.depends_on if d in models} for key, m in models.items()}
    order = list(TopologicalSorter(graph).static_order())
    return [models[k] for k in order]


def load_checks() -> list[Check]:
    checks = []
    for p in _files("checks"):
        headers, sql = _parse(p.read_text(encoding="utf-8"))
        severity = headers.get("severity", "error").lower()
        if severity not in ("error", "warn"):
            raise ValueError(f"{p.name}: severity must be error or warn")
        checks.append(
            Check(
                name=headers.get("check", p.name[:-4]),
                severity=severity,
                sql=sql,
                description=headers.get("description", ""),
                source=p.name,
            )
        )
    return checks


@dataclass
class Registry:
    models: list[Model] = field(default_factory=load_models)
    checks: list[Check] = field(default_factory=load_checks)
