"""Run data-quality checks and record their results.

Each check is a SELECT of violating rows. Results go to ``marts.dq_check_results``
(one row per check per run, with a sample of violations), failures are emitted as
``quality_check_failed`` events, and ``error`` severity fails the run.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any

from .events import emit
from .models import Check
from .warehouse import Warehouse

SAMPLE_ROWS = 10


@dataclass
class CheckOutcome:
    check: Check
    violations: int
    sample: list[dict[str, Any]]

    @property
    def passed(self) -> bool:
        return self.violations == 0


@dataclass
class CheckReport:
    run_id: str
    outcomes: list[CheckOutcome] = field(default_factory=list)

    @property
    def failed_errors(self) -> list[CheckOutcome]:
        return [o for o in self.outcomes if not o.passed and o.check.severity == "error"]

    @property
    def failed_warnings(self) -> list[CheckOutcome]:
        return [o for o in self.outcomes if not o.passed and o.check.severity == "warn"]

    @property
    def ok(self) -> bool:
        return not self.failed_errors

    def summary(self) -> dict[str, Any]:
        return {
            "checks": len(self.outcomes),
            "passed": sum(o.passed for o in self.outcomes),
            "errors": [o.check.name for o in self.failed_errors],
            "warnings": [o.check.name for o in self.failed_warnings],
        }


def run_checks(wh: Warehouse, checks: list[Check], run_id: str) -> CheckReport:
    report = CheckReport(run_id)
    checked_at = datetime.now(UTC)
    rows_out = []
    for check in checks:
        rendered = wh.render(check.sql)
        count = wh.query(f"SELECT COUNT(*) AS n FROM (\n{rendered}\n) AS v")[0]["n"]
        sample = wh.query(f"SELECT * FROM (\n{rendered}\n) AS v LIMIT {SAMPLE_ROWS}") if count else []
        outcome = CheckOutcome(check, int(count), sample)
        report.outcomes.append(outcome)
        rows_out.append(
            {
                "run_id": run_id,
                "checked_at": checked_at,
                "check_name": check.name,
                "severity": check.severity,
                "description": check.description,
                "violations": outcome.violations,
                "passed": outcome.passed,
                "sample": json.dumps(sample, default=str) if sample else None,
            }
        )
        if outcome.passed:
            emit("quality_check_passed", check=check.name, severity_level=check.severity)
        else:
            emit(
                "quality_check_failed",
                severity="ERROR" if check.severity == "error" else "WARNING",
                check=check.name,
                severity_level=check.severity,
                violations=outcome.violations,
                description=check.description,
                sample=sample[:3],
                run_id=run_id,
            )
    wh.insert_rows("marts", "dq_check_results", rows_out)
    return report
