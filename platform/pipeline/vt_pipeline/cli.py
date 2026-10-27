"""``vt-pipeline`` command line."""

from __future__ import annotations

import argparse
import sys
import time

from .config import PipelineSettings
from .events import emit
from .models import Registry
from .stages import (
    ALL_STAGES,
    PipelineFailed,
    run,
    stage_check,
    stage_extract,
    stage_load,
    stage_reconcile,
    stage_transform,
)
from .warehouse import make_warehouse


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="vt-pipeline", description="Volleyball Tactics data pipeline")
    sub = parser.add_subparsers(dest="command", required=True)
    for name, help_ in (
        ("extract", "Postgres (+ scoresheets) → Parquet lake"),
        ("load", "lake → raw tables"),
        ("transform", "build staging and marts"),
        ("check", "run data-quality checks"),
        ("reconcile", "source vs warehouse, scoresheets vs app"),
    ):
        sub.add_parser(name, help=help_)
    p_run = sub.add_parser("run", help="all stages in order")
    p_run.add_argument("--skip", action="append", default=[], choices=ALL_STAGES, help="stage to skip (repeatable)")
    p_sched = sub.add_parser("schedule", help="run forever on an interval (the compose service)")
    p_sched.add_argument("--every", type=int, default=900, help="seconds between runs")
    p_sched.add_argument("--skip", action="append", default=[], choices=ALL_STAGES)
    p_sql = sub.add_parser("show-sql", help="print a model's SQL rendered for the current target")
    p_sql.add_argument("model", help="model name, e.g. agg_rotation_performance (or 'all')")
    sub.add_parser("list", help="list models and checks")

    args = parser.parse_args(argv)
    settings = PipelineSettings()

    try:
        if args.command == "extract":
            batch = stage_extract(settings)
            print(batch or "nothing new")
        elif args.command == "load":
            print(stage_load(settings) or "nothing new")
        elif args.command == "transform":
            print("\n".join(stage_transform(settings)))
        elif args.command == "check":
            report = stage_check(settings)
            print(report.summary())
            return 0 if report.ok else 1
        elif args.command == "reconcile":
            print(stage_reconcile(settings))
        elif args.command == "run":
            stages = tuple(s for s in ALL_STAGES if s not in args.skip)
            print(run(settings, stages))
        elif args.command == "schedule":
            stages = tuple(s for s in ALL_STAGES if s not in args.skip)
            while True:
                try:
                    run(settings, stages)
                except PipelineFailed as exc:
                    emit("scheduled_run_failed", severity="ERROR", error=str(exc))
                except Exception as exc:  # keep the scheduler alive; the run itself already alerted
                    emit("scheduled_run_crashed", severity="ERROR", error=repr(exc))
                time.sleep(args.every)
        elif args.command == "show-sql":
            wh = make_warehouse(settings)
            try:
                for m in Registry().models:
                    if args.model in ("all", m.name):
                        print(f"-- {m.layer}.{m.name}\n{wh.render(m.sql)}\n")
            finally:
                wh.close()
        elif args.command == "list":
            reg = Registry()
            for m in reg.models:
                print(f"model  {m.layer:8s} {m.name:32s} {m.description}")
            for c in reg.checks:
                print(f"check  {c.severity:8s} {c.name:32s} {c.description}")
    except PipelineFailed as exc:
        print(str(exc), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
