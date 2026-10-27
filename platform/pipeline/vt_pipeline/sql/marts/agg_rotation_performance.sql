-- model: agg_rotation_performance
-- layer: marts
-- depends_on: marts.fct_rallies, marts.fct_stat_events, marts.dim_matches
-- description: Per match and rotation: side-out and break-point rates from the rallies, hitting and serving numbers from the events. Numerators and denominators are kept so dashboards can re-aggregate.
WITH rally AS (
  SELECT
    match_id,
    rotation,
    COUNT(*)                                     AS rallies,
    COUNTIF(won)                                 AS rallies_won,
    COUNTIF(is_sideout_opportunity)              AS sideout_opps,
    COUNTIF(is_sideout_opportunity AND won)      AS sideouts,
    COUNTIF(is_breakpoint_opportunity)           AS breakpoint_opps,
    COUNTIF(is_breakpoint_opportunity AND won)   AS breakpoints
  FROM {{ marts.fct_rallies }}
  GROUP BY match_id, rotation
),
ev AS (
  SELECT
    match_id,
    rotation,
    COUNTIF(stat IN ('kill', 'attackTip', 'attackTooled'))                                                   AS kills,
    COUNTIF(stat IN ('attackError', 'attackBlocked'))                                                        AS attack_errors,
    COUNTIF(stat IN ('kill', 'attackTip', 'attackTooled', 'attackError', 'attackBlocked', 'attackAttempt'))  AS attack_attempts,
    COUNTIF(stat = 'ace')                                                                                    AS aces,
    COUNTIF(stat = 'serviceError')                                                                           AS service_errors,
    COUNTIF(stat IN ('blockSolo', 'blockAssist'))                                                            AS blocks,
    COUNTIF(stat = 'dig')                                                                                    AS digs,
    COUNTIF(stat IN ('passPerfect', 'passGood', 'passPoor', 'passError'))                                    AS passes,
    SUM(CASE stat WHEN 'passPerfect' THEN 3 WHEN 'passGood' THEN 2 WHEN 'passPoor' THEN 1 ELSE 0 END)         AS pass_points
  FROM {{ marts.fct_stat_events }}
  WHERE NOT is_team_event AND rotation IS NOT NULL
  GROUP BY match_id, rotation
),
keys AS (
  SELECT match_id, rotation FROM rally
  UNION DISTINCT
  SELECT match_id, rotation FROM ev
)
SELECT
  k.match_id,
  m.match_date,
  m.opponent,
  m.season,
  m.lineup_id,
  m.lineup_name,
  k.rotation,
  COALESCE(r.rallies, 0)                                 AS rallies,
  COALESCE(r.rallies_won, 0)                             AS rallies_won,
  r.rallies_won / NULLIF(r.rallies, 0)                   AS point_win_rate,
  COALESCE(r.sideout_opps, 0)                            AS sideout_opps,
  COALESCE(r.sideouts, 0)                                AS sideouts,
  r.sideouts / NULLIF(r.sideout_opps, 0)                 AS sideout_rate,
  COALESCE(r.breakpoint_opps, 0)                         AS breakpoint_opps,
  COALESCE(r.breakpoints, 0)                             AS breakpoints,
  r.breakpoints / NULLIF(r.breakpoint_opps, 0)           AS breakpoint_rate,
  COALESCE(e.kills, 0)                                   AS kills,
  COALESCE(e.attack_errors, 0)                           AS attack_errors,
  COALESCE(e.attack_attempts, 0)                         AS attack_attempts,
  (e.kills - e.attack_errors) / NULLIF(e.attack_attempts, 0) AS hit_pct,
  COALESCE(e.aces, 0)                                    AS aces,
  COALESCE(e.service_errors, 0)                          AS service_errors,
  COALESCE(e.blocks, 0)                                  AS blocks,
  COALESCE(e.digs, 0)                                    AS digs,
  COALESCE(e.passes, 0)                                  AS passes,
  e.pass_points / NULLIF(e.passes, 0)                    AS pass_avg
FROM keys AS k
JOIN {{ marts.dim_matches }} AS m ON m.match_id = k.match_id
LEFT JOIN rally AS r ON r.match_id = k.match_id AND r.rotation = k.rotation
LEFT JOIN ev    AS e ON e.match_id = k.match_id AND e.rotation = k.rotation
