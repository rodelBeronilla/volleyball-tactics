-- model: agg_team_match_results
-- layer: marts
-- depends_on: marts.dim_matches, marts.agg_team_set_results, marts.fct_stat_events
-- description: One row per match: result, side-out %, break-point %, team hitting % and box totals. Same definitions as the app's Season page.
WITH sets AS (
  SELECT
    match_id,
    SUM(rallies)          AS rallies,
    SUM(sideout_opps)     AS sideout_opps,
    SUM(sideouts)         AS sideouts,
    SUM(breakpoint_opps)  AS breakpoint_opps,
    SUM(breakpoints)      AS breakpoints
  FROM {{ marts.agg_team_set_results }}
  GROUP BY match_id
),
box AS (
  SELECT
    match_id,
    COUNTIF(stat IN ('kill', 'attackTip', 'attackTooled'))                                                   AS kills,
    COUNTIF(stat IN ('attackError', 'attackBlocked'))                                                        AS attack_errors,
    COUNTIF(stat IN ('kill', 'attackTip', 'attackTooled', 'attackError', 'attackBlocked', 'attackAttempt'))  AS attack_attempts,
    COUNTIF(stat = 'ace')                                                                                    AS aces,
    COUNTIF(stat = 'serviceError')                                                                           AS service_errors,
    COUNTIF(stat IN ('blockSolo', 'blockAssist'))                                                            AS blocks,
    COUNTIF(stat = 'dig')                                                                                    AS digs,
    COUNTIF(stat = 'assist')                                                                                 AS assists,
    COUNTIF(stat IN ('passPerfect', 'passGood', 'passPoor', 'passError'))                                    AS passes,
    SUM(CASE stat WHEN 'passPerfect' THEN 3 WHEN 'passGood' THEN 2 WHEN 'passPoor' THEN 1 ELSE 0 END)         AS pass_points
  FROM {{ marts.fct_stat_events }}
  WHERE NOT is_team_event
  GROUP BY match_id
)
SELECT
  m.match_id,
  m.match_date,
  m.opponent,
  m.season,
  m.lineup_id,
  m.lineup_name,
  m.completed,
  m.result,
  m.sets_played,
  m.sets_won,
  m.sets_lost,
  COALESCE(s.rallies, 0)                                   AS rallies,
  COALESCE(s.sideout_opps, 0)                              AS sideout_opps,
  COALESCE(s.sideouts, 0)                                  AS sideouts,
  s.sideouts / NULLIF(s.sideout_opps, 0)                   AS sideout_rate,
  COALESCE(s.breakpoint_opps, 0)                           AS breakpoint_opps,
  COALESCE(s.breakpoints, 0)                               AS breakpoints,
  s.breakpoints / NULLIF(s.breakpoint_opps, 0)             AS breakpoint_rate,
  COALESCE(b.kills, 0)                                     AS kills,
  COALESCE(b.attack_errors, 0)                             AS attack_errors,
  COALESCE(b.attack_attempts, 0)                           AS attack_attempts,
  (b.kills - b.attack_errors) / NULLIF(b.attack_attempts, 0) AS hit_pct,
  COALESCE(b.aces, 0)                                      AS aces,
  COALESCE(b.service_errors, 0)                            AS service_errors,
  COALESCE(b.blocks, 0)                                    AS blocks,
  COALESCE(b.digs, 0)                                      AS digs,
  COALESCE(b.assists, 0)                                   AS assists,
  COALESCE(b.passes, 0)                                    AS passes,
  b.pass_points / NULLIF(b.passes, 0)                      AS pass_avg
FROM {{ marts.dim_matches }} AS m
LEFT JOIN sets AS s ON s.match_id = m.match_id
LEFT JOIN box  AS b ON b.match_id = m.match_id
