-- model: agg_rotation_season
-- layer: marts
-- depends_on: marts.agg_rotation_performance
-- description: Season roll-up of agg_rotation_performance per rotation (the Rotations page in the app).
SELECT
  season,
  rotation,
  COUNT(DISTINCT match_id)                                      AS matches,
  SUM(rallies)                                                  AS rallies,
  SUM(rallies_won)                                              AS rallies_won,
  SUM(rallies_won) / NULLIF(SUM(rallies), 0)                    AS point_win_rate,
  SUM(sideout_opps)                                             AS sideout_opps,
  SUM(sideouts)                                                 AS sideouts,
  SUM(sideouts) / NULLIF(SUM(sideout_opps), 0)                  AS sideout_rate,
  SUM(breakpoint_opps)                                          AS breakpoint_opps,
  SUM(breakpoints)                                              AS breakpoints,
  SUM(breakpoints) / NULLIF(SUM(breakpoint_opps), 0)            AS breakpoint_rate,
  SUM(kills)                                                    AS kills,
  SUM(attack_errors)                                            AS attack_errors,
  SUM(attack_attempts)                                          AS attack_attempts,
  (SUM(kills) - SUM(attack_errors)) / NULLIF(SUM(attack_attempts), 0) AS hit_pct,
  SUM(aces)                                                     AS aces,
  SUM(service_errors)                                           AS service_errors,
  SUM(blocks)                                                   AS blocks,
  SUM(digs)                                                     AS digs
FROM {{ marts.agg_rotation_performance }}
GROUP BY season, rotation
