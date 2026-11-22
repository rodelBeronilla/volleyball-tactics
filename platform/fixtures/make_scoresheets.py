"""Build the sample league scoresheets from the demo season, with known discrepancies.

The scoresheets stand in for a third-party source (the league's official results).
They are generated from the same simulated season the app ships with, then a few
deliberate differences are planted so the reconciliation has something to find:

* Dig Deep, 2026-09-22, set 2: the sheet gives the opponent one point too many.
* Net Gains, 2026-09-15: Marcus (#9) is credited two kills fewer than the app recorded.
* A set against "Spike Lee" on 2026-10-27 that the app never recorded (a forfeit).
* The last match of the season (2026-10-20) is missing from the sheet entirely.

Run from the repo root: ``python platform/fixtures/make_scoresheets.py``
"""

from __future__ import annotations

import csv
import gzip
import json
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE / "scoresheets"
KILLS = {"kill", "attackTip", "attackTooled"}
BLOCKS = {"blockSolo", "blockAssist"}


def main() -> None:
    with gzip.open(HERE / "demo_season_sync.json.gz", "rt", encoding="utf-8") as fh:
        payload = json.load(fh)
    players = {p["id"]: p for p in payload["players"]}
    matches = sorted(payload["matches"], key=lambda m: m["date"])
    on_sheet = matches[:-1]  # the last match never made it onto the league's sheet

    OUT.mkdir(exist_ok=True)
    with (OUT / "2026-fall.sets.csv").open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["match_date", "opponent", "set_number", "our_score", "their_score"])
        for m in on_sheet:
            for s in m["sets"]:
                their = s["theirScore"] + (1 if m["opponent"] == "Dig Deep" and s["number"] == 2 else 0)
                w.writerow([m["date"], m["opponent"], s["number"], s["ourScore"], their])
        w.writerow(["2026-10-27", "Spike Lee", 1, 25, 0])

    box: dict[tuple[str, str], dict[str, int]] = defaultdict(lambda: defaultdict(int))
    for e in payload["statEntries"]:
        if e["playerId"] == "__team__":
            continue
        line = box[(e["matchId"], e["playerId"])]
        if e["stat"] in KILLS:
            line["kills"] += 1
        elif e["stat"] == "ace":
            line["aces"] += 1
        elif e["stat"] in BLOCKS:
            line["blocks"] += 1
        elif e["stat"] == "dig":
            line["digs"] += 1
        elif e["stat"] == "assist":
            line["assists"] += 1
        else:
            line["_other"] += 1

    with (OUT / "2026-fall.players.csv").open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["match_date", "opponent", "player_number", "player_name", "kills", "aces", "blocks", "digs", "assists"])
        for m in on_sheet:
            for pid, p in sorted(players.items(), key=lambda kv: kv[1]["number"]):
                line = box.get((m["id"], pid))
                if not line:
                    continue
                kills = line["kills"] - (2 if m["opponent"] == "Net Gains" and p["number"] == 9 else 0)
                w.writerow([m["date"], m["opponent"], p["number"], p["name"], kills, line["aces"], line["blocks"], line["digs"], line["assists"]])
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
