-- model: agg_team_set_results
-- layer: marts
-- depends_on: staging.stg_match_sets, marts.dim_matches, marts.fct_rallies
-- description: One row per set: recorded score plus side-out and break-point numbers derived from the rallies.
WITH rally AS (
  SELECT
    match_id,
    set_number,
    COUNT(*)                                           AS rallies,
    COUNTIF(won)                                       AS rallies_won,
    COUNTIF(NOT won)                                   AS rallies_lost,
    COUNTIF(is_sideout_opportunity)                    AS sideout_opps,
    COUNTIF(is_sideout_opportunity AND won)            AS sideouts,
    COUNTIF(is_breakpoint_opportunity)                 AS breakpoint_opps,
    COUNTIF(is_breakpoint_opportunity AND won)         AS breakpoints
  FROM {{ marts.fct_rallies }}
  GROUP BY match_id, set_number
)
SELECT
  s.match_id,
  m.match_date,
  m.opponent,
  m.season,
  s.set_number,
  s.our_score,
  s.their_score,
  s.won,
  COALESCE(r.rallies, 0)          AS rallies,
  COALESCE(r.rallies_won, 0)      AS rallies_won,
  COALESCE(r.rallies_lost, 0)     AS rallies_lost,
  COALESCE(r.sideout_opps, 0)     AS sideout_opps,
  COALESCE(r.sideouts, 0)         AS sideouts,
  r.sideouts / NULLIF(r.sideout_opps, 0)        AS sideout_rate,
  COALESCE(r.breakpoint_opps, 0)  AS breakpoint_opps,
  COALESCE(r.breakpoints, 0)      AS breakpoints,
  r.breakpoints / NULLIF(r.breakpoint_opps, 0)  AS breakpoint_rate
FROM {{ staging.stg_match_sets }} AS s
JOIN {{ marts.dim_matches }} AS m ON m.match_id = s.match_id
LEFT JOIN rally AS r ON r.match_id = s.match_id AND r.set_number = s.set_number
