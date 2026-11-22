-- model: fct_rallies
-- layer: marts
-- depends_on: staging.stg_rallies, staging.stg_rally_actions, marts.dim_matches
-- partition_by: match_date
-- cluster_by: match_id, rotation
-- description: One row per rally of an active match. A rally on the opponent's serve is a side-out opportunity; on ours, a break-point opportunity.
WITH touches AS (
  SELECT
    rally_id,
    COUNT(*)                                                                                      AS n_touches,
    COUNTIF(stat IN ('kill', 'attackTip', 'attackTooled', 'attackError', 'attackBlocked', 'attackAttempt')) AS n_attacks,
    COUNTIF(stat IN ('kill', 'attackTip', 'attackTooled'))                                        AS n_kills
  FROM {{ staging.stg_rally_actions }}
  GROUP BY rally_id
)
SELECT
  r.rally_id,
  r.match_id,
  m.match_date,
  m.opponent,
  m.season,
  r.set_number,
  r.rally_number,
  r.rotation,
  r.serving_team,
  r.our_score_before,
  r.their_score_before,
  r.outcome,
  r.outcome = 'won'                 AS won,
  r.serving_team = 'them'           AS is_sideout_opportunity,
  r.serving_team = 'us'             AS is_breakpoint_opportunity,
  CASE
    WHEN r.serving_team = 'them' AND r.outcome = 'won'  THEN 'sideout'
    WHEN r.serving_team = 'them'                        THEN 'sideout_lost'
    WHEN r.outcome = 'won'                              THEN 'breakpoint'
    ELSE                                                     'breakpoint_lost'
  END                               AS point_type,
  COALESCE(t.n_touches, 0)          AS n_touches,
  COALESCE(t.n_attacks, 0)          AS n_attacks,
  COALESCE(t.n_kills, 0)            AS n_kills
FROM {{ staging.stg_rallies }} AS r
JOIN {{ marts.dim_matches }} AS m ON m.match_id = r.match_id
LEFT JOIN touches AS t ON t.rally_id = r.rally_id
WHERE NOT r.is_deleted
