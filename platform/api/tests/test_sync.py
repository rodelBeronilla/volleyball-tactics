"""End-to-end: the demo season goes through POST /v1/sync into Postgres."""

import copy

from vt_api.db import connect


def _count(db, sql, *params):
    with connect(db) as conn:
        return conn.execute(sql, params).fetchone()["n"]


def test_sync_requires_token(client, demo_payload):
    assert client.post("/v1/sync", json=demo_payload).status_code == 401
    assert client.post("/v1/sync", json=demo_payload, headers={"Authorization": "Bearer nope"}).status_code == 401


def test_sync_is_disabled_without_a_configured_token(settings, demo_payload):
    from fastapi.testclient import TestClient

    from vt_api.main import create_app

    settings = settings.model_copy(update={"sync_token": None})
    with TestClient(create_app(settings)) as c:
        assert c.post("/v1/sync", json=demo_payload, headers={"Authorization": "Bearer x"}).status_code == 503


def test_healthz(client):
    r = client.get("/healthz")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_first_sync_inserts_everything(client, auth, db, demo_payload):
    r = client.post("/v1/sync", json=demo_payload, headers=auth)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["rejected"] == []
    assert body["warnings"] == []
    ch = body["changes"]
    assert ch["players"] == {"inserted": len(demo_payload["players"]), "updated": 0, "deleted": 0}
    assert ch["matches"]["inserted"] == len(demo_payload["matches"])
    assert ch["rallies"]["inserted"] == len(demo_payload["rallies"])
    assert ch["stat_events"]["inserted"] == len(demo_payload["statEntries"])
    assert ch["night_plans"]["inserted"] == 1

    assert _count(db, "SELECT count(*) AS n FROM rally_actions") == sum(
        len(r["actions"]) for r in demo_payload["rallies"]
    )
    assert _count(db, "SELECT count(*) AS n FROM match_sets") == sum(len(m["sets"]) for m in demo_payload["matches"])
    assert _count(db, "SELECT count(*) AS n FROM lineup_slots") == 18
    assert _count(db, "SELECT count(*) AS n FROM stat_events WHERE is_team_event") == len(demo_payload["rallies"])
    assert _count(db, "SELECT count(*) AS n FROM sync_batches") == 1

    # The database enforces what the app only assumes.
    with connect(db) as conn:
        row = conn.execute(
            """
            SELECT count(*) FILTER (WHERE s.our_score <> w.won_cnt OR s.their_score <> w.lost_cnt) AS mismatched
              FROM match_sets s
              JOIN (SELECT match_id, set_number,
                           count(*) FILTER (WHERE outcome = 'won') AS won_cnt,
                           count(*) FILTER (WHERE outcome = 'lost') AS lost_cnt
                      FROM rallies GROUP BY 1, 2) w USING (match_id, set_number)
            """
        ).fetchone()
        assert row["mismatched"] == 0


def test_resending_the_same_snapshot_changes_nothing(client, auth, db, demo_payload):
    client.post("/v1/sync", json=demo_payload, headers=auth)
    before = _count(db, "SELECT max(updated_at) AS n FROM stat_events")
    r = client.post("/v1/sync", json=demo_payload, headers=auth)
    assert r.status_code == 200
    for table, ch in r.json()["changes"].items():
        assert ch == {"inserted": 0, "updated": 0, "deleted": 0}, table
    assert _count(db, "SELECT max(updated_at) AS n FROM stat_events") == before
    assert _count(db, "SELECT count(*) AS n FROM sync_batches") == 2


def test_edits_update_only_the_changed_rows_and_their_children(client, auth, db, demo_payload):
    client.post("/v1/sync", json=demo_payload, headers=auth)
    edited = copy.deepcopy(demo_payload)
    rally = next(r for r in edited["rallies"] if len(r["actions"]) >= 3)
    rally["actions"] = rally["actions"][:1]  # drop touches from one rally
    edited["players"][0]["name"] = "Maya R."

    r = client.post("/v1/sync", json=edited, headers=auth)
    ch = r.json()["changes"]
    assert ch["rallies"] == {"inserted": 0, "updated": 1, "deleted": 0}
    assert ch["players"] == {"inserted": 0, "updated": 1, "deleted": 0}
    assert ch["stat_events"] == {"inserted": 0, "updated": 0, "deleted": 0}
    assert _count(db, "SELECT count(*) AS n FROM rally_actions WHERE rally_id = %s", rally["id"]) == 1
    assert _count(db, "SELECT count(*) AS n FROM players WHERE name = 'Maya R.'") == 1


def test_rows_missing_from_a_snapshot_are_soft_deleted_then_restored(client, auth, db, demo_payload):
    client.post("/v1/sync", json=demo_payload, headers=auth)
    trimmed = copy.deepcopy(demo_payload)
    gone = trimmed["matches"].pop()  # the coach deleted the last match in the app
    trimmed["rallies"] = [x for x in trimmed["rallies"] if x["matchId"] != gone["id"]]
    trimmed["statEntries"] = [x for x in trimmed["statEntries"] if x["matchId"] != gone["id"]]
    removed_events = len(demo_payload["statEntries"]) - len(trimmed["statEntries"])

    r = client.post("/v1/sync", json=trimmed, headers=auth)
    ch = r.json()["changes"]
    assert ch["matches"]["deleted"] == 1
    assert ch["stat_events"]["deleted"] == removed_events
    assert _count(db, "SELECT count(*) AS n FROM matches WHERE deleted_at IS NOT NULL") == 1
    # history is kept, nothing is physically removed
    assert _count(db, "SELECT count(*) AS n FROM stat_events") == len(demo_payload["statEntries"])

    r = client.post("/v1/sync", json=demo_payload, headers=auth)  # restored from another export
    ch = r.json()["changes"]
    assert ch["matches"] == {"inserted": 0, "updated": 1, "deleted": 0}
    assert ch["stat_events"]["updated"] == removed_events
    assert _count(db, "SELECT count(*) AS n FROM matches WHERE deleted_at IS NOT NULL") == 0


def test_another_device_cannot_delete_what_it_did_not_write(client, auth, db, demo_payload):
    client.post("/v1/sync", json=demo_payload, headers=auth)
    other = {
        "clientId": "second-phone",
        "players": demo_payload["players"],
        "lineups": [],
        "matches": [],
        "rallies": [],
        "statEntries": [],
    }
    r = client.post("/v1/sync", json=other, headers=auth)
    assert r.status_code == 200
    assert all(ch["deleted"] == 0 for ch in r.json()["changes"].values())
    assert _count(db, "SELECT count(*) AS n FROM matches WHERE deleted_at IS NULL") == len(demo_payload["matches"])


def test_bad_rows_are_reported_and_the_rest_is_stored(client, auth, db, demo_payload):
    bad = copy.deepcopy(demo_payload)
    bad["statEntries"][0]["playerId"] = "ghost"
    r = client.post("/v1/sync", json=bad, headers=auth)
    assert r.status_code == 200
    body = r.json()
    assert body["rejected"] == [
        {"table": "stat_events", "id": bad["statEntries"][0]["id"], "reason": "unknown player 'ghost'"}
    ]
    assert body["changes"]["stat_events"]["inserted"] == len(bad["statEntries"]) - 1
    assert _count(db, "SELECT count(*) AS n FROM sync_rejections") == 1
    batches = client.get("/v1/batches", headers=auth).json()
    assert batches[0]["rejectedCount"] == 1
    assert batches[0]["rejections"][0]["reason"] == "unknown player 'ghost'"


def test_malformed_envelope_is_a_422(client, auth):
    assert client.post("/v1/sync", json={"players": []}, headers=auth).status_code == 422
    r = client.post("/v1/sync", content=b"not json", headers={**auth, "Content-Type": "application/json"})
    assert r.status_code == 422


def test_summary_endpoint(client, auth, demo_payload):
    client.post("/v1/sync", json=demo_payload, headers=auth)
    s = client.get("/v1/summary", headers=auth).json()
    rows = {t["table"]: t["rows"] for t in s["tables"]}
    assert rows["rallies"] == len(demo_payload["rallies"])
    assert s["lastBatch"]["clientId"] == demo_payload["clientId"]
    assert s["watermarks"] == {}
