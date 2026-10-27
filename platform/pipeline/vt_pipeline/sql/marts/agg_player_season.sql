-- model: agg_player_season
-- layer: marts
-- depends_on: marts.agg_player_match_box
-- description: Season line per player: box totals, hitting %, pass average and per-set rates (sets played = sets in which the player recorded an event).
SELECT
  season,
  player_id,
  player_name,
  jersey_number,
  position,
  COUNT(DISTINCT match_id)                                        AS matches_played,
  SUM(sets_played)                                                AS sets_played,
  SUM(events)                                                     AS events,
  SUM(kills)                                                      AS kills,
  SUM(attack_errors)                                              AS attack_errors,
  SUM(attack_blocked)                                             AS attack_blocked,
  SUM(attack_attempts)                                            AS attack_attempts,
  (SUM(kills) - SUM(attack_errors) - SUM(attack_blocked)) / NULLIF(SUM(attack_attempts), 0) AS hit_pct,
  SUM(kills) / NULLIF(SUM(sets_played), 0)                        AS kills_per_set,
  SUM(serves)                                                     AS serves,
  SUM(aces)                                                       AS aces,
  SUM(service_errors)                                             AS service_errors,
  SUM(aces) / NULLIF(SUM(sets_played), 0)                         AS aces_per_set,
  SUM(passes)                                                     AS passes,
  SUM(pass_points) / NULLIF(SUM(passes), 0)                       AS pass_avg,
  SUM(pass_perfect) / NULLIF(SUM(passes), 0)                      AS perfect_pass_rate,
  SUM(blocks)                                                     AS blocks,
  SUM(blocks) / NULLIF(SUM(sets_played), 0)                       AS blocks_per_set,
  SUM(digs)                                                       AS digs,
  SUM(digs) / NULLIF(SUM(sets_played), 0)                         AS digs_per_set,
  SUM(assists)                                                    AS assists,
  SUM(assists) / NULLIF(SUM(sets_played), 0)                      AS assists_per_set,
  SUM(set_errors) + SUM(ball_handling_errors)                     AS setting_errors
FROM (
  SELECT b.*, 3 * b.pass_perfect + 2 * b.pass_good + b.pass_poor AS pass_points
  FROM {{ marts.agg_player_match_box }} AS b
)
GROUP BY season, player_id, player_name, jersey_number, position
