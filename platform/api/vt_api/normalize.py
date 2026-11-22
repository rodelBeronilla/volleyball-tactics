"""Turn an app snapshot into relational rows, validating as we go.

Policy
------
* **Required references** (an event's player or match, a rally's match, an action's
  player, an event's rally when it names one, every stat key) must resolve to a row
  accepted earlier in the same payload. If not, the row is *rejected* and reported
  back; nothing is silently dropped or invented.
* **Optional references** (a lineup's libero or slot player, a match's lineup) are
  nulled with a warning when they do not resolve: the app itself leaves these
  dangling after a delete, and the parent row is still meaningful without them.
* Rejections cascade naturally: a rejected rally is unknown to the events that
  reference it, so they are rejected too, with their own reason.

Every parent row gets a ``content_hash`` over its normalised fields *and* its
children, so the database can tell a real change from a re-sent snapshot.
"""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass, field
from datetime import UTC, date, datetime
from typing import Any

from .schemas import SyncPayload
from .stat_types import STAT_KEYS

POSITIONS = frozenset({"setter", "outside", "middle", "opposite", "libero", "ds"})
TEAM_ROW = "__team__"
MAX_ID_LEN = 200

PARENT_TABLES = (
    "players",
    "lineups",
    "matches",
    "rallies",
    "stat_events",
    "stat_event_summaries",
    "night_plans",
)
CHILD_OF = {
    "lineup_slots": "lineups",
    "match_sets": "matches",
    "rally_actions": "rallies",
    "stat_event_summary_counts": "stat_event_summaries",
}


class RowError(ValueError):
    """A row failed validation; the message is the reason reported back."""


@dataclass(slots=True)
class Rejection:
    table: str
    row_id: str | None
    reason: str
    row: dict[str, Any] | None = None


@dataclass(slots=True)
class Normalized:
    parents: dict[str, list[dict[str, Any]]] = field(default_factory=dict)
    children: dict[str, dict[str, list[dict[str, Any]]]] = field(default_factory=dict)
    rejections: list[Rejection] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    counts: dict[str, int] = field(default_factory=dict)

    def ids(self, table: str) -> list[str]:
        return [r["id"] for r in self.parents.get(table, [])]


# ── field coercion ─────────────────────────────────────────────────────────


def _id(v: Any, what: str = "id") -> str:
    if v is None or isinstance(v, bool):
        raise RowError(f"missing {what}")
    s = str(v).strip()
    if not s or len(s) > MAX_ID_LEN:
        raise RowError(f"invalid {what}")
    return s


def _text(v: Any, default: str | None = None, *, required: str | None = None) -> str | None:
    if v is None or (isinstance(v, str) and not v.strip()):
        if required:
            raise RowError(f"missing {required}")
        return default
    return str(v)


def _int(v: Any, what: str, *, lo: int | None = None, hi: int | None = None, optional: bool = False) -> int | None:
    if v is None or v == "":
        if optional:
            return None
        raise RowError(f"missing {what}")
    if isinstance(v, bool):
        raise RowError(f"invalid {what}")
    try:
        n = int(v)
    except (TypeError, ValueError) as exc:
        raise RowError(f"invalid {what}") from exc
    if (lo is not None and n < lo) or (hi is not None and n > hi):
        raise RowError(f"{what} out of range: {n}")
    return n


def _float(v: Any) -> float | None:
    if v is None or v == "":
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def _bool(v: Any) -> bool | None:
    if v is None:
        return None
    if isinstance(v, bool):
        return v
    if isinstance(v, (int, float)):
        return bool(v)
    if isinstance(v, str):
        return v.strip().lower() in {"true", "1", "yes"}
    return None


def _date(v: Any) -> str | None:
    """YYYY-MM-DD from a date string, an ISO timestamp or epoch milliseconds."""
    if v is None or v == "":
        return None
    if isinstance(v, (int, float)) and not isinstance(v, bool):
        return datetime.fromtimestamp(v / 1000, tz=UTC).date().isoformat()
    s = str(v).strip()
    try:
        return date.fromisoformat(s[:10]).isoformat()
    except ValueError:
        return None


def _timestamp(v: Any) -> str | None:
    """ISO-8601 UTC from epoch milliseconds (what the app writes) or an ISO string."""
    if v is None or v == "":
        return None
    if isinstance(v, (int, float)) and not isinstance(v, bool):
        return datetime.fromtimestamp(v / 1000, tz=UTC).isoformat()
    s = str(v).strip()
    try:
        dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
    except ValueError:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC)
    return dt.astimezone(UTC).isoformat()


def _json_or_none(v: Any) -> str | None:
    if v is None:
        return None
    return json.dumps(v, sort_keys=True, separators=(",", ":"), default=str)


def content_hash(parent: dict[str, Any], children: list[dict[str, Any]] | None = None) -> str:
    blob = json.dumps({"row": parent, "children": children or []}, sort_keys=True, separators=(",", ":"), default=str)
    return hashlib.sha256(blob.encode("utf-8")).hexdigest()


# ── per-table normalisers ──────────────────────────────────────────────────


def _dedupe(rows: list[dict[str, Any]], table: str, out: Normalized) -> list[dict[str, Any]]:
    """Last occurrence of an id wins; earlier duplicates are reported as warnings."""
    seen: dict[str, int] = {}
    for i, r in enumerate(rows):
        rid = r.get("id") if isinstance(r, dict) else None
        if rid is not None:
            seen[str(rid)] = i
    kept = [r for i, r in enumerate(rows) if not isinstance(r, dict) or r.get("id") is None or seen[str(r["id"])] == i]
    dups = len(rows) - len(kept)
    if dups:
        out.warnings.append(f"{table}: {dups} duplicate id(s) in payload, kept the last occurrence")
    return kept


def _player(raw: dict[str, Any]) -> dict[str, Any]:
    pos = _text(raw.get("position"), required="position")
    if pos not in POSITIONS:
        raise RowError(f"unknown position {pos!r}")
    row = {
        "id": _id(raw.get("id")),
        "name": _text(raw.get("name"), required="name"),
        "number": _int(raw.get("number"), "number", optional=True),
        "position": pos,
        "base_ratings": _json_or_none(raw.get("baseRatings")),
        "archetype": _text(raw.get("archetype")),
        "rating_history": _json_or_none(raw.get("ratingHistory")),
    }
    row["content_hash"] = content_hash(row)
    return row


def _lineup(raw: dict[str, Any], players: set[str], out: Normalized) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    lid = _id(raw.get("id"))
    libero = _text(raw.get("liberoId"))
    if libero is not None and libero not in players:
        out.warnings.append(f"lineups/{lid}: libero {libero!r} is not a known player, cleared")
        libero = None
    slots: list[dict[str, Any]] = []
    raw_slots = raw.get("slots") or {}
    if not isinstance(raw_slots, dict):
        raise RowError("slots must be an object")
    for key, pid in raw_slots.items():
        slot = _int(key, "slot", lo=1, hi=6)
        player = _text(pid)
        if player is not None and player not in players:
            out.warnings.append(f"lineups/{lid}: slot {slot} player {player!r} is not a known player, cleared")
            player = None
        slots.append({"slot": slot, "player_id": player})
    slots.sort(key=lambda s: s["slot"])
    row = {
        "id": lid,
        "name": _text(raw.get("name"), "Lineup"),
        "system": _text(raw.get("system"), "5-1"),
        "libero_id": libero,
        "overrides": _json_or_none(raw.get("overrides")),
    }
    row["content_hash"] = content_hash(row, slots)
    return row, slots


def _match(raw: dict[str, Any]) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    mid = _id(raw.get("id"))
    match_date = _date(raw.get("date")) or _date(raw.get("createdAt"))
    if match_date is None:
        raise RowError("missing or invalid date")
    sets: list[dict[str, Any]] = []
    for s in raw.get("sets") or []:
        if not isinstance(s, dict):
            raise RowError("invalid set")
        sets.append(
            {
                "set_number": _int(s.get("number"), "set number", lo=1),
                "our_score": _int(s.get("ourScore"), "our score", lo=0) or 0,
                "their_score": _int(s.get("theirScore"), "their score", lo=0) or 0,
                "won": _bool(s.get("won")),
            }
        )
    if len({s["set_number"] for s in sets}) != len(sets):
        raise RowError("duplicate set numbers")
    sets.sort(key=lambda s: s["set_number"])
    row = {
        "id": mid,
        "opponent": _text(raw.get("opponent"), "Opponent"),
        "match_date": match_date,
        "lineup_id": _text(raw.get("lineupId")),
        "completed": bool(_bool(raw.get("completed"))),
        "night_plan_set_ref": _json_or_none(raw.get("nightPlanSetRef")),
    }
    row["content_hash"] = content_hash(row, sets)
    return row, sets


def _rally(raw: dict[str, Any], matches: set[str], players: set[str]) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    rid = _id(raw.get("id"))
    match_id = _id(raw.get("matchId"), "matchId")
    if match_id not in matches:
        raise RowError(f"unknown match {match_id!r}")
    serving = _text(raw.get("servingTeam"), required="servingTeam")
    if serving not in ("us", "them"):
        raise RowError(f"invalid servingTeam {serving!r}")
    outcome = _text(raw.get("outcome"), required="outcome")
    if outcome not in ("won", "lost"):
        raise RowError(f"invalid outcome {outcome!r}")
    actions_raw = raw.get("actions") or []
    if not isinstance(actions_raw, list):
        raise RowError("actions must be a list")
    ordered = sorted(
        enumerate(actions_raw),
        key=lambda ia: (
            ia[1].get("order") if isinstance(ia[1], dict) and ia[1].get("order") is not None else 1e9,
            ia[0],
        ),
    )
    actions: list[dict[str, Any]] = []
    for n, (_, a) in enumerate(ordered, start=1):
        if not isinstance(a, dict):
            raise RowError("invalid action")
        pid = _id(a.get("playerId"), "action playerId")
        if pid not in players:
            raise RowError(f"action {n} references unknown player {pid!r}")
        stat = _text(a.get("stat"), required="action stat")
        if stat not in STAT_KEYS:
            raise RowError(f"action {n} has unknown stat {stat!r}")
        actions.append({"action_order": n, "player_id": pid, "stat": stat})
    row = {
        "id": rid,
        "match_id": match_id,
        "set_number": _int(raw.get("setNumber"), "setNumber", lo=1),
        "rally_number": _int(raw.get("rallyNumber"), "rallyNumber", lo=1),
        "rotation": _int(raw.get("rotation"), "rotation", lo=1, hi=6),
        "serving_team": serving,
        "our_score_before": _int(raw.get("ourScore"), "ourScore", lo=0),
        "their_score_before": _int(raw.get("theirScore"), "theirScore", lo=0),
        "outcome": outcome,
    }
    row["content_hash"] = content_hash(row, actions)
    return row, actions


def _event(raw: dict[str, Any], matches: set[str], rallies: set[str], players: set[str]) -> dict[str, Any]:
    eid = _id(raw.get("id"))
    match_id = _id(raw.get("matchId"), "matchId")
    if match_id not in matches:
        raise RowError(f"unknown match {match_id!r}")
    rally_id = _text(raw.get("rallyId"))
    if rally_id is not None and rally_id not in rallies:
        raise RowError(f"unknown rally {rally_id!r}")
    stat = _text(raw.get("stat"), required="stat")
    if stat not in STAT_KEYS:
        raise RowError(f"unknown stat {stat!r}")
    pid = _text(raw.get("playerId"))
    is_team = pid == TEAM_ROW or pid is None
    if not is_team and pid not in players:
        raise RowError(f"unknown player {pid!r}")
    serving = _text(raw.get("servingTeam"))
    if serving is not None and serving not in ("us", "them"):
        raise RowError(f"invalid servingTeam {serving!r}")
    row = {
        "id": eid,
        "match_id": match_id,
        "set_number": _int(raw.get("setNumber"), "setNumber", lo=1),
        "rally_id": rally_id,
        "player_id": None if is_team else pid,
        "is_team_event": is_team,
        "rotation": _int(raw.get("rotation"), "rotation", lo=1, hi=6, optional=True),
        "stat": stat,
        "serving_team": serving,
        "event_ts": _timestamp(raw.get("timestamp")),
        "video_ts": _float(raw.get("videoTimestamp")),
    }
    row["content_hash"] = content_hash(row)
    return row


def _summary(
    raw: dict[str, Any], matches: set[str], players: set[str], out: Normalized
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    sid = _id(raw.get("id"))
    match_id = _id(raw.get("matchId"), "matchId")
    if match_id not in matches:
        raise RowError(f"unknown match {match_id!r}")
    pid = _text(raw.get("playerId"))
    if pid == TEAM_ROW:
        pid = None
    if pid is not None and pid not in players:
        raise RowError(f"unknown player {pid!r}")
    set_numbers = raw.get("setNumbers") or []
    if not isinstance(set_numbers, list):
        raise RowError("setNumbers must be a list")
    set_numbers = sorted({_int(n, "set number", lo=1) for n in set_numbers})
    counts_raw = raw.get("counts") or {}
    if not isinstance(counts_raw, dict):
        raise RowError("counts must be an object")
    counts: list[dict[str, Any]] = []
    for stat, n in counts_raw.items():
        if stat not in STAT_KEYS:
            out.warnings.append(f"stat_event_summaries/{sid}: unknown stat {stat!r} ignored")
            continue
        value = _int(n, f"count for {stat}", lo=0)
        if value:
            counts.append({"stat": stat, "n": value})
    counts.sort(key=lambda c: c["stat"])
    row = {
        "id": sid,
        "match_id": match_id,
        "player_id": pid,
        "rotation": _int(raw.get("rotation"), "rotation", lo=1, hi=6, optional=True),
        "set_numbers": json.dumps(set_numbers),
    }
    row["content_hash"] = content_hash(row, counts)
    return row, counts


def _night_plan(raw: dict[str, Any]) -> dict[str, Any]:
    row = {
        "id": _id(raw.get("id")),
        "name": _text(raw.get("name")),
        "plan_date": _date(raw.get("date")),
        "plan": _json_or_none(raw),
    }
    row["content_hash"] = content_hash(row)
    return row


# ── driver ─────────────────────────────────────────────────────────────────


def normalize(payload: SyncPayload) -> Normalized:
    out = Normalized()
    out.counts = {
        "players": len(payload.players),
        "lineups": len(payload.lineups),
        "matches": len(payload.matches),
        "rallies": len(payload.rallies),
        "statEntries": len(payload.stat_entries),
        "nightPlans": len(payload.night_plans),
    }
    for t in PARENT_TABLES:
        out.parents[t] = []
    for c in CHILD_OF:
        out.children[c] = {}

    def reject(table: str, raw: Any, exc: Exception) -> None:
        rid = raw.get("id") if isinstance(raw, dict) else None
        out.rejections.append(
            Rejection(table, str(rid) if rid is not None else None, str(exc), raw if isinstance(raw, dict) else None)
        )

    for raw in _dedupe(payload.players, "players", out):
        try:
            out.parents["players"].append(_player(raw))
        except RowError as exc:
            reject("players", raw, exc)
    players = set(out.ids("players"))

    for raw in _dedupe(payload.lineups, "lineups", out):
        try:
            row, slots = _lineup(raw, players, out)
        except RowError as exc:
            reject("lineups", raw, exc)
            continue
        out.parents["lineups"].append(row)
        out.children["lineup_slots"][row["id"]] = slots

    for raw in _dedupe(payload.matches, "matches", out):
        try:
            row, sets = _match(raw)
        except RowError as exc:
            reject("matches", raw, exc)
            continue
        out.parents["matches"].append(row)
        out.children["match_sets"][row["id"]] = sets
    matches = set(out.ids("matches"))

    for raw in _dedupe(payload.rallies, "rallies", out):
        try:
            row, actions = _rally(raw, matches, players)
        except RowError as exc:
            reject("rallies", raw, exc)
            continue
        out.parents["rallies"].append(row)
        out.children["rally_actions"][row["id"]] = actions
    rallies = set(out.ids("rallies"))

    for raw in _dedupe(payload.stat_entries, "statEntries", out):
        try:
            if raw.get("type") == "summary":
                row, counts = _summary(raw, matches, players, out)
                out.parents["stat_event_summaries"].append(row)
                out.children["stat_event_summary_counts"][row["id"]] = counts
            else:
                out.parents["stat_events"].append(_event(raw, matches, rallies, players))
        except RowError as exc:
            reject("stat_events", raw, exc)

    for raw in _dedupe(payload.night_plans, "nightPlans", out):
        try:
            out.parents["night_plans"].append(_night_plan(raw))
        except RowError as exc:
            reject("night_plans", raw, exc)

    return out
