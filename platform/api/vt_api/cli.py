"""``vt-api migrate`` and ``vt-api serve``."""

from __future__ import annotations

import argparse
import logging
import sys

from .config import Settings
from .db import connect
from .migrate import migrate


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="vt-api", description="Volleyball Tactics sync API")
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("migrate", help="apply pending SQL migrations and seed reference data")
    serve = sub.add_parser("serve", help="run the API with uvicorn")
    serve.add_argument("--host", default="0.0.0.0")
    serve.add_argument("--port", type=int, default=8080)
    serve.add_argument("--workers", type=int, default=1)
    args = parser.parse_args(argv)

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    settings = Settings()

    if args.command == "migrate":
        with connect(settings.database_url) as conn:
            applied = migrate(conn)
        print("applied: " + (", ".join(applied) if applied else "nothing (schema is current)"))
        return 0

    if args.command == "serve":
        import uvicorn

        uvicorn.run("vt_api.main:app", host=args.host, port=args.port, workers=args.workers, log_level="info")
        return 0

    return 2


if __name__ == "__main__":
    sys.exit(main())
