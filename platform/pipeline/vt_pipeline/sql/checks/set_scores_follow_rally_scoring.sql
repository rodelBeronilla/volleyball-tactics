-- check: set_scores_follow_rally_scoring
-- severity: warn
-- description: A finished set reaches at least 25 and is won by two (or ends exactly two apart past 25). Leagues with capped sets will see warnings here.
SELECT match_id, opponent, match_date, set_number, our_score, their_score
FROM {{ marts.agg_team_set_results }}
WHERE won IS NOT NULL
  AND (
       GREATEST(our_score, their_score) < 25
    OR ABS(our_score - their_score) < 2
    OR (GREATEST(our_score, their_score) > 25 AND ABS(our_score - their_score) <> 2)
  )
