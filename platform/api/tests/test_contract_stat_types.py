"""The API's stat vocabulary must match the web app's, field for field."""

import re
from pathlib import Path

from vt_api.stat_types import STAT_TYPES

JS = Path(__file__).resolve().parents[3] / "src" / "data" / "statCategories.js"
LINE = re.compile(
    r"^\s*(\w+):\s*\{\s*label:\s*'([^']*)',\s*group:\s*'(\w+)',\s*positive:\s*(true|false),\s*attribute:\s*(?:'(\w+)'|null)"
)


def test_stat_types_match_the_app():
    text = JS.read_text(encoding="utf-8")
    body = text.split("export const STATS = {", 1)[1].split("\n};", 1)[0]
    from_js = set()
    for line in body.splitlines():
        m = LINE.match(line)
        if m:
            from_js.add((m.group(1), m.group(2), m.group(3), m.group(4) == "true", m.group(5)))
    assert from_js, "could not parse src/data/statCategories.js"
    assert set(STAT_TYPES) == from_js
