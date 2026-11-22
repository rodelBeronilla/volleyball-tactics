-- model: stg_match_sets
-- layer: staging
-- depends_on: raw.match_sets, staging.stg_matches
-- description: Final (or running) score of each set, from the current version of its match.
SELECT s.match_id, s.set_number, s.our_score, s.their_score, s.won
FROM {{ raw.match_sets }} AS s
JOIN {{ staging.stg_matches }} AS m
  ON m.match_id = s.match_id AND m._batch_id = s._batch_id
