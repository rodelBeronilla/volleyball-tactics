import copy

from vt_api.normalize import content_hash, normalize
from vt_api.schemas import SyncPayload


def _payload(d: dict) -> SyncPayload:
    return SyncPayload.model_validate(d)


def test_demo_season_normalises_without_rejections(demo_payload):
    n = normalize(_payload(demo_payload))
    assert n.rejections == []
    assert n.warnings == []
    assert len(n.parents["players"]) == len(demo_payload["players"])
    assert len(n.parents["matches"]) == len(demo_payload["matches"])
    assert len(n.parents["rallies"]) == len(demo_payload["rallies"])
    assert len(n.parents["stat_events"]) == len(demo_payload["statEntries"])
    # every rally's actions were carried over, in order
    total_actions = sum(len(r["actions"]) for r in demo_payload["rallies"])
    assert sum(len(a) for a in n.children["rally_actions"].values()) == total_actions
    assert all(
        [a["action_order"] for a in acts] == list(range(1, len(acts) + 1))
        for acts in n.children["rally_actions"].values()
    )


def test_team_rows_become_null_player_with_flag(demo_payload):
    n = normalize(_payload(demo_payload))
    team = [e for e in n.parents["stat_events"] if e["is_team_event"]]
    assert len(team) == len(demo_payload["rallies"])
    assert all(e["player_id"] is None and e["stat"] in {"rallyWon", "rallyLost"} for e in team)
    assert all(not e["is_team_event"] and e["player_id"] for e in n.parents["stat_events"] if e not in team)


def test_epoch_timestamps_become_utc_iso(demo_payload):
    n = normalize(_payload(demo_payload))
    first = n.parents["stat_events"][0]
    assert first["event_ts"].startswith("2026-09-08T19:00")
    assert first["event_ts"].endswith("+00:00")
    assert n.parents["matches"][0]["match_date"] == "2026-09-08"


def test_content_hash_is_stable_and_sensitive(demo_payload):
    a = normalize(_payload(demo_payload))
    b = normalize(_payload(copy.deepcopy(demo_payload)))
    assert [r["content_hash"] for r in a.parents["rallies"]] == [r["content_hash"] for r in b.parents["rallies"]]

    changed = copy.deepcopy(demo_payload)
    changed["rallies"][0]["actions"][0]["stat"] = "dig"
    c = normalize(_payload(changed))
    assert c.parents["rallies"][0]["content_hash"] != a.parents["rallies"][0]["content_hash"]
    assert c.parents["rallies"][1]["content_hash"] == a.parents["rallies"][1]["content_hash"]
    assert content_hash({"x": 1}) == content_hash({"x": 1}, [])


def test_required_references_are_rejected_not_invented(demo_payload):
    bad = copy.deepcopy(demo_payload)
    broken_rally = next(r for r in bad["rallies"] if r["actions"])
    broken_rally["actions"][0]["playerId"] = "ghost"
    # two bad events in a rally that is otherwise fine
    other = [e for e in bad["statEntries"] if e["rallyId"] == bad["rallies"][-1]["id"]]
    other[0]["playerId"] = "ghost"
    other[1]["stat"] = "flyingKick"

    n = normalize(_payload(bad))
    reasons = {(r.table, r.row_id): r.reason for r in n.rejections}
    assert reasons[("stat_events", other[0]["id"])] == "unknown player 'ghost'"
    assert reasons[("stat_events", other[1]["id"])] == "unknown stat 'flyingKick'"
    assert "unknown player 'ghost'" in reasons[("rallies", broken_rally["id"])]
    # events of the rejected rally cascade, with their own reason
    cascaded = [r for r in n.rejections if r.table == "stat_events" and "unknown rally" in r.reason]
    assert len(cascaded) == sum(1 for e in bad["statEntries"] if e["rallyId"] == broken_rally["id"])
    assert len(n.parents["stat_events"]) == len(bad["statEntries"]) - 2 - len(cascaded)


def test_optional_references_are_cleared_with_a_warning(demo_payload):
    p = copy.deepcopy(demo_payload)
    p["lineups"][0]["liberoId"] = "ghost"
    p["lineups"][0]["slots"]["3"] = "ghost"
    n = normalize(_payload(p))
    assert n.rejections == []
    lineup = n.parents["lineups"][0]
    assert lineup["libero_id"] is None
    assert [s for s in n.children["lineup_slots"][lineup["id"]] if s["slot"] == 3][0]["player_id"] is None
    assert len(n.warnings) == 2


def test_duplicates_keep_last_occurrence(demo_payload):
    p = copy.deepcopy(demo_payload)
    dup = copy.deepcopy(p["players"][0])
    dup["name"] = "Renamed"
    p["players"].append(dup)
    n = normalize(_payload(p))
    names = {r["id"]: r["name"] for r in n.parents["players"]}
    assert names[dup["id"]] == "Renamed"
    assert any("duplicate" in w for w in n.warnings)


def test_summary_rows_are_split_into_counts():
    payload = {
        "clientId": "c",
        "players": [{"id": "p1", "name": "A", "position": "setter"}],
        "matches": [
            {
                "id": "m1",
                "opponent": "X",
                "date": "2026-01-01",
                "sets": [{"number": 1, "ourScore": 25, "theirScore": 20, "won": True}],
            }
        ],
        "statEntries": [
            {
                "type": "summary",
                "id": "s1",
                "matchId": "m1",
                "playerId": "p1",
                "rotation": 2,
                "setNumbers": [1, 2],
                "counts": {"kill": 3, "dig": 0, "bogus": 2},
            },
            {
                "type": "summary",
                "id": "s2",
                "matchId": "m1",
                "playerId": "__team__",
                "rotation": 2,
                "setNumbers": [1],
                "counts": {"rallyWon": 10},
            },
        ],
    }
    n = normalize(_payload(payload))
    assert n.rejections == []
    assert [r["player_id"] for r in n.parents["stat_event_summaries"]] == ["p1", None]
    assert n.children["stat_event_summary_counts"]["s1"] == [{"stat": "kill", "n": 3}]
    assert n.parents["stat_event_summaries"][0]["set_numbers"] == "[1, 2]"
    assert any("bogus" in w for w in n.warnings)


def test_match_without_date_falls_back_to_created_at_then_rejects():
    base = {
        "clientId": "c",
        "players": [],
        "matches": [{"id": "m1", "opponent": "X", "createdAt": "2026-02-03T19:00:00.000Z", "sets": []}],
    }
    n = normalize(_payload(base))
    assert n.parents["matches"][0]["match_date"] == "2026-02-03"
    base["matches"][0].pop("createdAt")
    n = normalize(_payload(base))
    assert n.rejections[0].reason == "missing or invalid date"
