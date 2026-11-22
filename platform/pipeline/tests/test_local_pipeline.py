"""End to end on the local target: Postgres → Parquet lake → DuckDB → marts → checks → reconciliation.

The same code path runs on GCP with Cloud Storage and BigQuery; only the adapters differ.
"""

from __future__ import annotations

import copy
from collections import Counter

import pytest

from vt_pipeline.lake import LocalLake
from vt_pipeline.stages import (
    PipelineFailed,
    run,
    stage_check,
    stage_extract,
    stage_load,
    stage_reconcile,
    stage_transform,
)
from vt_pipeline.warehouse import DuckDBWarehouse

from .conftest import sync_payload

KILLS = {"kill", "attackTip", "attackTooled"}


def _wh(settings) -> DuckDBWarehouse:
    return DuckDBWarehouse(settings.duckdb_file, {"freshness_hours": settings.freshness_hours})


def _one(wh, sql):
    return list(wh.query(sql)[0].values())[0]


def test_end_to_end_matches_the_app_numbers(settings, demo_payload):
    batch = stage_extract(settings)
    assert batch
    manifests = LocalLake(settings.lake_dir).manifests()
    assert [m["batch_id"] for m in manifests] == [batch]
    files = manifests[0]["files"]
    assert files["stat_events"]["rows"] == len(demo_payload["statEntries"])
    assert files["rallies"]["rows"] == len(demo_payload["rallies"])
    assert files["scoresheet_sets"]["rows"] == 19
    assert manifests[0]["source_counts"]["matches"] == len(demo_payload["matches"])
    assert set(manifests[0]["watermarks"]) >= {"players", "matches", "rallies", "stat_events"}

    assert stage_load(settings) == [batch]
    assert stage_load(settings) == []  # idempotent: a loaded batch is never loaded twice

    built = stage_transform(settings)
    assert "marts.agg_player_match_box" in built and "marts.rec_scoresheet_sets" in built

    wh = _wh(settings)
    try:
        assert _one(wh, "SELECT COUNT(*) FROM marts.dim_players") == len(demo_payload["players"])
        assert _one(wh, "SELECT COUNT(*) FROM marts.dim_matches") == len(demo_payload["matches"])
        assert _one(wh, "SELECT COUNT(*) FROM marts.fct_rallies") == len(demo_payload["rallies"])
        assert _one(wh, "SELECT COUNT(*) FROM marts.fct_stat_events") == len(demo_payload["statEntries"])
        assert _one(wh, "SELECT COUNT(*) FROM raw.stat_events") == len(demo_payload["statEntries"])

        # Season results agree with the app's definitions, computed straight from the payload.
        by_match = {m["id"]: m for m in demo_payload["matches"]}
        kills_by_match = Counter(e["matchId"] for e in demo_payload["statEntries"] if e["stat"] in KILLS)
        rows = wh.query(
            "SELECT match_id, result, sets_won, sets_lost, kills, sideout_opps, sideouts "
            "FROM marts.agg_team_match_results"
        )
        assert len(rows) == len(by_match)
        for r in rows:
            m = by_match[r["match_id"]]
            won = sum(1 for s in m["sets"] if s["won"])
            assert (r["sets_won"], r["sets_lost"]) == (won, len(m["sets"]) - won)
            assert r["result"] == ("W" if won > len(m["sets"]) - won else "L")
            assert r["kills"] == kills_by_match[m["id"]]
            opps = [x for x in demo_payload["rallies"] if x["matchId"] == m["id"] and x["servingTeam"] == "them"]
            assert (r["sideout_opps"], r["sideouts"]) == (len(opps), sum(1 for x in opps if x["outcome"] == "won"))

        # Set scores in the mart are the recorded ones and agree with the rallies (also a DQ check).
        assert (
            _one(
                wh,
                "SELECT COUNT(*) FROM marts.agg_team_set_results "
                "WHERE our_score <> rallies_won OR their_score <> rallies_lost",
            )
            == 0
        )

        # Player season line for Marcus (p6) matches a straight count of the event log.
        p6 = [e for e in demo_payload["statEntries"] if e["playerId"] == "p6"]
        season = wh.query(
            "SELECT kills, attack_attempts, hit_pct, aces, digs, sets_played "
            "FROM marts.agg_player_season WHERE player_id = 'p6'"
        )[0]
        kills = sum(1 for e in p6 if e["stat"] in KILLS)
        errors = sum(1 for e in p6 if e["stat"] in {"attackError", "attackBlocked"})
        attempts = kills + errors + sum(1 for e in p6 if e["stat"] == "attackAttempt")
        assert season["kills"] == kills and season["attack_attempts"] == attempts
        assert season["hit_pct"] == pytest.approx((kills - errors) / attempts)
        assert season["aces"] == sum(1 for e in p6 if e["stat"] == "ace")
        assert season["sets_played"] == len({(e["matchId"], e["setNumber"]) for e in p6})

        # Every attack pairs with Maya, the only setter the simulator ever uses.
        pairs = wh.query(
            "SELECT setter_id, SUM(attempts) AS attempts, SUM(kills) AS kills "
            "FROM marts.agg_setter_hitter_pairs GROUP BY setter_id"
        )
        assert [p["setter_id"] for p in pairs] == ["p1"]
        assert pairs[0]["kills"] == sum(kills_by_match.values())

        # Rotation analytics: six rotations per match, rates between 0 and 1.
        assert _one(wh, "SELECT COUNT(*) FROM marts.agg_rotation_season") == 6
        assert (
            _one(wh, "SELECT COUNT(*) FROM marts.agg_rotation_performance WHERE sideout_rate < 0 OR sideout_rate > 1")
            == 0
        )

        report = stage_check(settings, wh)
        assert report.ok, report.summary()
        assert report.failed_warnings == [], report.summary()
        assert _one(wh, "SELECT COUNT(*) FROM marts.dq_check_results WHERE passed") == len(report.outcomes)

        rec = stage_reconcile(settings, wh)
        assert rec["source_counts"] == {"tables": 7, "mismatches": []}
        assert rec["scoresheet_sets"] == {"match": 17, "mismatch": 1, "missing_in_app": 1, "missing_in_scoresheet": 3}
        mism = wh.query(
            "SELECT opponent, set_number, their_score_diff FROM marts.rec_scoresheet_sets WHERE status = 'mismatch'"
        )
        assert mism == [{"opponent": "Dig Deep", "set_number": 2, "their_score_diff": 1}]
        players = wh.query(
            "SELECT player_name, opponent, kills_diff FROM marts.rec_scoresheet_players WHERE status = 'mismatch'"
        )
        assert players == [{"player_name": "Marcus", "opponent": "Net Gains", "kills_diff": -2}]
        last_match_lines = _one(
            wh, "SELECT COUNT(*) FROM marts.agg_player_match_box WHERE match_date = DATE '2026-10-20'"
        )
        assert rec["scoresheet_players"]["missing_in_scoresheet"] == last_match_lines
        assert rec["scoresheet_players"].get("missing_in_app", 0) == 0
    finally:
        wh.close()


def test_second_extract_is_incremental_and_carries_deletes(settings, source_db, demo_payload):
    first = run(settings)
    assert first["status"] == "success"
    assert stage_extract(settings) is None  # nothing changed, no batch

    # The coach deletes the last match in the app; the next sync soft-deletes it on the server.
    trimmed = copy.deepcopy(demo_payload)
    gone = trimmed["matches"].pop()
    trimmed["rallies"] = [r for r in trimmed["rallies"] if r["matchId"] != gone["id"]]
    trimmed["statEntries"] = [e for e in trimmed["statEntries"] if e["matchId"] != gone["id"]]
    removed_events = len(demo_payload["statEntries"]) - len(trimmed["statEntries"])
    sync_payload(source_db, trimmed)

    batch2 = stage_extract(settings)
    assert batch2
    manifest = LocalLake(settings.lake_dir).manifests()[-1]
    assert manifest["batch_id"] == batch2
    assert manifest["files"]["matches"]["rows"] == 1  # only the deleted match moved
    assert manifest["files"]["stat_events"]["rows"] == removed_events
    assert "players" not in manifest["files"]  # untouched tables are not re-extracted
    assert manifest["source_counts"]["matches"] == len(demo_payload["matches"]) - 1

    assert stage_load(settings) == [batch2]
    stage_transform(settings)
    wh = _wh(settings)
    try:
        assert _one(wh, "SELECT COUNT(*) FROM marts.dim_matches") == len(demo_payload["matches"]) - 1
        assert (
            _one(wh, "SELECT COUNT(*) FROM marts.fct_stat_events") == len(demo_payload["statEntries"]) - removed_events
        )
        assert _one(wh, "SELECT COUNT(*) FROM staging.stg_matches WHERE is_deleted") == 1
        # raw keeps both versions; staging keeps one per key
        assert _one(wh, "SELECT COUNT(*) FROM raw.matches") == len(demo_payload["matches"]) + 1
        assert stage_check(settings, wh).ok
        assert stage_reconcile(settings, wh)["source_counts"]["mismatches"] == []
    finally:
        wh.close()


def test_checks_catch_corrupted_data_and_fail_the_run(settings):
    run(settings)
    wh = _wh(settings)
    try:
        wh.execute(
            "UPDATE raw.match_sets SET our_score = our_score + 1 WHERE match_id = 'demo-match-1' AND set_number = 1"
        )
        wh.execute("UPDATE raw.rallies SET rotation = 9 WHERE id = 'demo-match-1-s1-r1'")
        wh.execute("UPDATE raw.stat_events SET player_id = 'ghost' WHERE id = 'demo-stat-1'")
        stage_transform(settings, wh)
        report = stage_check(settings, wh)
        assert not report.ok
        failed = {o.check.name: o.violations for o in report.failed_errors}
        assert failed["set_scores_match_rally_outcomes"] == 1
        assert failed["rotation_in_range"] == 1
        assert failed["events_reference_known_player"] == 1
        sample = wh.query(
            "SELECT sample FROM marts.dq_check_results WHERE check_name = 'rotation_in_range' AND NOT passed"
        )[0]["sample"]
        assert "demo-match-1-s1-r1" in sample
    finally:
        wh.close()

    with pytest.raises(PipelineFailed):
        run(settings, stages=("transform", "check"))
    wh = _wh(settings)
    try:
        assert wh.query("SELECT status FROM marts.etl_runs ORDER BY started_at DESC LIMIT 1")[0]["status"] == "failed"
    finally:
        wh.close()


def test_stale_data_raises_a_freshness_warning(settings):
    run(settings)
    stale = settings.model_copy(update={"freshness_hours": 0})
    report = stage_check(stale)
    assert report.ok
    assert [o.check.name for o in report.failed_warnings] == ["freshness"]
