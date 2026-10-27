-- check: running_score_is_continuous
-- severity: error
-- description: Within a set, each rally starts at the score the previous rally ended on, and the first rally starts at 0-0.
WITH seq AS (
  SELECT
    match_id, set_number, rally_number, our_score_before, their_score_before, won,
    LAG(our_score_before)   OVER (PARTITION BY match_id, set_number ORDER BY rally_number) AS prev_our,
    LAG(their_score_before) OVER (PARTITION BY match_id, set_number ORDER BY rally_number) AS prev_their,
    LAG(won)                OVER (PARTITION BY match_id, set_number ORDER BY rally_number) AS prev_won
  FROM {{ marts.fct_rallies }}
)
SELECT match_id, set_number, rally_number, our_score_before, their_score_before, prev_our, prev_their, prev_won
FROM seq
WHERE (prev_our IS NULL AND (our_score_before <> 0 OR their_score_before <> 0))
   OR (prev_our IS NOT NULL AND (
          our_score_before   <> prev_our   + CASE WHEN prev_won THEN 1 ELSE 0 END
       OR their_score_before <> prev_their + CASE WHEN prev_won THEN 0 ELSE 1 END))
