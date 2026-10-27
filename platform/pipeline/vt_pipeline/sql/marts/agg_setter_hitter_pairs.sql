-- model: agg_setter_hitter_pairs
-- layer: marts
-- depends_on: staging.stg_rally_actions, marts.fct_rallies, marts.dim_players
-- description: Setter-hitter connections. Within a rally the k-th attack is paired with the k-th setting touch (assist or set attempt), which is how the app and the simulator record them.
WITH actions AS (
  SELECT a.rally_id, a.action_order, a.player_id, a.stat, r.season
  FROM {{ staging.stg_rally_actions }} AS a
  JOIN {{ marts.fct_rallies }} AS r ON r.rally_id = a.rally_id
),
attacks AS (
  SELECT rally_id, player_id, stat, season,
         ROW_NUMBER() OVER (PARTITION BY rally_id ORDER BY action_order) AS seq
  FROM actions
  WHERE stat IN ('kill', 'attackTip', 'attackTooled', 'attackError', 'attackBlocked', 'attackAttempt')
),
setting AS (
  SELECT rally_id, player_id,
         ROW_NUMBER() OVER (PARTITION BY rally_id ORDER BY action_order) AS seq
  FROM actions
  WHERE stat IN ('assist', 'setAttempt')
),
pairs AS (
  SELECT s.player_id AS setter_id, a.player_id AS hitter_id, a.season, a.stat
  FROM attacks AS a
  JOIN setting AS s ON s.rally_id = a.rally_id AND s.seq = a.seq
)
SELECT
  p.season,
  p.setter_id,
  sp.name                                                   AS setter_name,
  p.hitter_id,
  hp.name                                                   AS hitter_name,
  hp.position                                               AS hitter_position,
  COUNT(*)                                                  AS attempts,
  COUNTIF(p.stat IN ('kill', 'attackTip', 'attackTooled'))  AS kills,
  COUNTIF(p.stat IN ('attackError', 'attackBlocked'))       AS errors,
  (COUNTIF(p.stat IN ('kill', 'attackTip', 'attackTooled')) - COUNTIF(p.stat IN ('attackError', 'attackBlocked')))
    / NULLIF(COUNT(*), 0)                                   AS hit_pct,
  COUNTIF(p.stat IN ('kill', 'attackTip', 'attackTooled')) / NULLIF(COUNT(*), 0) AS kill_rate
FROM pairs AS p
LEFT JOIN {{ marts.dim_players }} AS sp ON sp.player_id = p.setter_id
LEFT JOIN {{ marts.dim_players }} AS hp ON hp.player_id = p.hitter_id
GROUP BY p.season, p.setter_id, sp.name, p.hitter_id, hp.name, hp.position
