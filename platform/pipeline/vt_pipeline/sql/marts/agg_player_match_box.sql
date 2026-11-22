-- model: agg_player_match_box
-- layer: marts
-- depends_on: marts.fct_stat_events, marts.dim_players, marts.dim_matches, staging.stg_stat_event_summaries, staging.stg_stat_event_summary_counts, staging.stg_stat_event_summary_sets
-- cluster_by: player_id
-- description: Box score per player per match. Counts come from the event log plus any compacted summaries; derived numbers use the app's definitions (hitting % = (kills - errors - blocked) / attempts, pass average on a 0-3 scale).
WITH event_counts AS (
  SELECT match_id, player_id, stat, COUNT(*) AS n
  FROM {{ marts.fct_stat_events }}
  WHERE NOT is_team_event AND player_id IS NOT NULL
  GROUP BY match_id, player_id, stat
),
summary_counts AS (
  SELECT s.match_id, s.player_id, c.stat, SUM(c.n) AS n
  FROM {{ staging.stg_stat_event_summaries }} AS s
  JOIN {{ staging.stg_stat_event_summary_counts }} AS c ON c.summary_id = s.summary_id
  JOIN {{ marts.dim_matches }} AS m ON m.match_id = s.match_id
  WHERE NOT s.is_deleted AND s.player_id IS NOT NULL
  GROUP BY s.match_id, s.player_id, c.stat
),
counts AS (
  SELECT * FROM event_counts
  UNION ALL
  SELECT * FROM summary_counts
),
pivoted AS (
  SELECT
    match_id,
    player_id,
    SUM(CASE WHEN stat = 'kill'              THEN n ELSE 0 END) AS kills_swing,
    SUM(CASE WHEN stat = 'attackTip'         THEN n ELSE 0 END) AS kills_tip,
    SUM(CASE WHEN stat = 'attackTooled'      THEN n ELSE 0 END) AS kills_tooled,
    SUM(CASE WHEN stat = 'attackError'       THEN n ELSE 0 END) AS attack_errors,
    SUM(CASE WHEN stat = 'attackBlocked'     THEN n ELSE 0 END) AS attack_blocked,
    SUM(CASE WHEN stat = 'attackAttempt'     THEN n ELSE 0 END) AS attack_in_play,
    SUM(CASE WHEN stat = 'ace'               THEN n ELSE 0 END) AS aces,
    SUM(CASE WHEN stat = 'serveInPlay'       THEN n ELSE 0 END) AS serves_in_play,
    SUM(CASE WHEN stat = 'serviceError'      THEN n ELSE 0 END) AS service_errors,
    SUM(CASE WHEN stat = 'passPerfect'       THEN n ELSE 0 END) AS pass_perfect,
    SUM(CASE WHEN stat = 'passGood'          THEN n ELSE 0 END) AS pass_good,
    SUM(CASE WHEN stat = 'passPoor'          THEN n ELSE 0 END) AS pass_poor,
    SUM(CASE WHEN stat = 'passError'         THEN n ELSE 0 END) AS pass_errors,
    SUM(CASE WHEN stat = 'blockSolo'         THEN n ELSE 0 END) AS block_solo,
    SUM(CASE WHEN stat = 'blockAssist'       THEN n ELSE 0 END) AS block_assists,
    SUM(CASE WHEN stat = 'blockError'        THEN n ELSE 0 END) AS block_errors,
    SUM(CASE WHEN stat = 'blockTouch'        THEN n ELSE 0 END) AS block_touches,
    SUM(CASE WHEN stat = 'dig'               THEN n ELSE 0 END) AS digs,
    SUM(CASE WHEN stat = 'defenseError'      THEN n ELSE 0 END) AS defense_errors,
    SUM(CASE WHEN stat = 'freeBall'          THEN n ELSE 0 END) AS free_balls,
    SUM(CASE WHEN stat = 'coverDig'          THEN n ELSE 0 END) AS cover_digs,
    SUM(CASE WHEN stat = 'assist'            THEN n ELSE 0 END) AS assists,
    SUM(CASE WHEN stat = 'setAttempt'        THEN n ELSE 0 END) AS set_attempts,
    SUM(CASE WHEN stat = 'setError'          THEN n ELSE 0 END) AS set_errors,
    SUM(CASE WHEN stat = 'ballHandlingError' THEN n ELSE 0 END) AS ball_handling_errors,
    SUM(CASE WHEN stat = 'violation'         THEN n ELSE 0 END) AS violations,
    SUM(CASE WHEN stat = 'substitution'      THEN n ELSE 0 END) AS substitutions,
    SUM(n)                                                      AS events
  FROM counts
  GROUP BY match_id, player_id
),
sets_played AS (
  SELECT match_id, player_id, COUNT(*) AS sets_played
  FROM (
    SELECT DISTINCT match_id, player_id, set_number
    FROM {{ marts.fct_stat_events }}
    WHERE NOT is_team_event AND player_id IS NOT NULL
    UNION DISTINCT
    SELECT DISTINCT s.match_id, s.player_id, x.set_number
    FROM {{ staging.stg_stat_event_summaries }} AS s
    JOIN {{ staging.stg_stat_event_summary_sets }} AS x ON x.summary_id = s.summary_id
    WHERE NOT s.is_deleted AND s.player_id IS NOT NULL
  )
  GROUP BY match_id, player_id
),
derived AS (
  SELECT
    p.*,
    p.kills_swing + p.kills_tip + p.kills_tooled                                                   AS kills,
    p.kills_swing + p.kills_tip + p.kills_tooled + p.attack_errors + p.attack_blocked + p.attack_in_play AS attack_attempts,
    p.aces + p.serves_in_play + p.service_errors                                                   AS serves,
    p.pass_perfect + p.pass_good + p.pass_poor + p.pass_errors                                     AS passes,
    3 * p.pass_perfect + 2 * p.pass_good + p.pass_poor                                             AS pass_points,
    p.block_solo + p.block_assists                                                                 AS blocks
  FROM pivoted AS p
)
SELECT
  d.match_id,
  m.match_date,
  m.opponent,
  m.season,
  d.player_id,
  pl.name                                               AS player_name,
  pl.jersey_number,
  pl.position,
  COALESCE(sp.sets_played, 1)                           AS sets_played,
  d.events,
  d.kills, d.kills_swing, d.kills_tip, d.kills_tooled,
  d.attack_errors, d.attack_blocked, d.attack_in_play, d.attack_attempts,
  (d.kills - d.attack_errors - d.attack_blocked) / NULLIF(d.attack_attempts, 0) AS hit_pct,
  d.serves, d.aces, d.serves_in_play, d.service_errors,
  d.passes, d.pass_perfect, d.pass_good, d.pass_poor, d.pass_errors,
  d.pass_points / NULLIF(d.passes, 0)                   AS pass_avg,
  d.blocks, d.block_solo, d.block_assists, d.block_errors, d.block_touches,
  d.digs, d.defense_errors, d.free_balls, d.cover_digs,
  d.assists, d.set_attempts, d.set_errors, d.ball_handling_errors,
  d.violations, d.substitutions
FROM derived AS d
JOIN {{ marts.dim_matches }} AS m ON m.match_id = d.match_id
LEFT JOIN {{ marts.dim_players }} AS pl ON pl.player_id = d.player_id
LEFT JOIN sets_played AS sp ON sp.match_id = d.match_id AND sp.player_id = d.player_id
