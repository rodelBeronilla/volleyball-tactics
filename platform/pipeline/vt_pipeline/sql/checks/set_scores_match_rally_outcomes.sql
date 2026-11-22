-- check: set_scores_match_rally_outcomes
-- severity: error
-- description: For every set with rally-by-rally data, rallies won equals our score and rallies lost equals theirs.
SELECT match_id, opponent, match_date, set_number, our_score, their_score, rallies_won, rallies_lost
FROM {{ marts.agg_team_set_results }}
WHERE rallies > 0
  AND (our_score <> rallies_won OR their_score <> rallies_lost)
