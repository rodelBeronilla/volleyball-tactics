from __future__ import annotations

from pathlib import Path

from vt_pipeline.source_scoresheets import collect, parse_player_lines, parse_sets

from .conftest import FIXTURES


def test_sample_scoresheets_parse_cleanly():
    batch = collect(str(FIXTURES / "scoresheets"))
    assert batch.files == ["2026-fall.players.csv", "2026-fall.sets.csv"]
    assert batch.rejected == []
    assert len(batch.sets) == 19  # 6 matches x 3 sets + one the app never recorded
    assert all(s["set_number"] >= 1 for s in batch.sets)
    assert batch.player_lines and all(line["player_number"] is not None for line in batch.player_lines)


def test_bad_rows_are_rejected_with_reasons():
    text = (
        "match_date,opponent,set_number,our_score,their_score\n"
        "2026-09-08,Block Party,1,25,20\n"
        "not-a-date,Block Party,2,25,20\n"
        "2026-09-08,,3,25,20\n"
        "2026-09-08,Block Party,0,25,20\n"
        "2026-09-08,Block Party,4,-1,20\n"
    )
    rows, rejected = parse_sets(text, "x.sets.csv")
    assert len(rows) == 1
    assert [r["row_number"] for r in rejected] == [3, 4, 5, 6]
    assert "invalid match_date" in rejected[0]["reason"]
    assert rejected[1]["reason"] == "empty opponent"
    assert "set_number below 1" in rejected[2]["reason"]
    assert "our_score below 0" in rejected[3]["reason"]


def test_missing_columns_reject_the_whole_file():
    rows, rejected = parse_player_lines("match_date,opponent\n2026-01-01,X\n", "y.players.csv")
    assert rows == []
    assert rejected[0]["row_number"] == 0 and "missing columns" in rejected[0]["reason"]


def test_blank_player_stats_are_not_reported(tmp_path: Path):
    (tmp_path / "a.players.csv").write_text(
        "match_date,opponent,player_number,player_name,kills,aces,blocks,digs,assists\n2026-01-01,X,9,Marcus,5,,,,\n",
        encoding="utf-8",
    )
    (tmp_path / "notes.txt").write_text("ignored", encoding="utf-8")
    batch = collect(str(tmp_path))
    assert batch.files == ["a.players.csv"]
    line = batch.player_lines[0]
    assert line["kills"] == 5 and line["aces"] is None and line["assists"] is None
