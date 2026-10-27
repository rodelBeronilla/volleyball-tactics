"""Reference list of event types.

Mirrors ``src/data/statCategories.js`` in the web app; ``tests/test_contract_stat_types.py``
fails if the two drift apart. Seeded into ``stat_types`` by ``vt-api migrate``.
"""

from __future__ import annotations

# (stat, label, group, positive, attribute)
STAT_TYPES: list[tuple[str, str, str, bool, str | None]] = [
    # attack
    ("kill", "Kill", "attack", True, "attack"),
    ("attackError", "Att Error", "attack", False, "attack"),
    ("attackBlocked", "Blocked", "attack", False, "attack"),
    ("attackTip", "Tip Kill", "attack", True, "attack"),
    ("attackTooled", "Tooled", "attack", True, "attack"),
    ("attackAttempt", "Attempt", "attack", True, "attack"),
    # serve
    ("ace", "Ace", "serve", True, "serve"),
    ("serveInPlay", "In Play", "serve", True, "serve"),
    ("serviceError", "Svc Error", "serve", False, "serve"),
    # pass
    ("passPerfect", "Perfect (3)", "pass", True, "pass"),
    ("passGood", "Good (2)", "pass", True, "pass"),
    ("passPoor", "Poor (1)", "pass", False, "pass"),
    ("passError", "Error (0)", "pass", False, "pass"),
    # block
    ("blockSolo", "Solo Block", "block", True, "block"),
    ("blockAssist", "Blk Assist", "block", True, "block"),
    ("blockError", "Blk Error", "block", False, "block"),
    ("blockTouch", "Blk Touch", "block", True, "block"),
    # defense
    ("dig", "Dig", "defense", True, "defense"),
    ("defenseError", "Def Error", "defense", False, "defense"),
    ("freeBall", "Free Ball", "defense", True, "defense"),
    ("coverDig", "Cover", "defense", True, "defense"),
    # setting
    ("assist", "Assist", "set", True, "set"),
    ("setError", "Set Error", "set", False, "set"),
    ("ballHandlingError", "BHE", "set", False, "set"),
    ("setAttempt", "Set Att", "set", True, "set"),
    # rally outcomes (team rows)
    ("rallyWon", "Won", "rally", True, None),
    ("rallyLost", "Lost", "rally", False, None),
    # misc
    ("violation", "Violation", "misc", False, None),
    ("substitution", "Sub", "misc", True, None),
]

STAT_KEYS: frozenset[str] = frozenset(s[0] for s in STAT_TYPES)
