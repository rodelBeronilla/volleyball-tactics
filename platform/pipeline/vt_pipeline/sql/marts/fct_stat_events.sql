-- model: fct_stat_events
-- layer: marts
-- depends_on: staging.stg_stat_events, staging.stg_players, staging.stg_stat_types, marts.dim_matches
-- partition_by: match_date
-- cluster_by: player_id, stat
-- description: The event log, enriched: one row per recorded touch (plus one team row per rally) of an active match, with player and stat attributes.
SELECT
  e.event_id,
  e.match_id,
  m.match_date,
  m.opponent,
  m.season,
  e.set_number,
  e.rally_id,
  e.rotation,
  e.player_id,
  p.name            AS player_name,
  p.jersey_number,
  p.position,
  e.is_team_event,
  e.stat,
  t.label           AS stat_label,
  t.stat_group,
  t.positive,
  t.attribute,
  e.serving_team,
  e.event_ts,
  e.video_ts
FROM {{ staging.stg_stat_events }} AS e
JOIN {{ marts.dim_matches }} AS m ON m.match_id = e.match_id
LEFT JOIN {{ staging.stg_players }} AS p ON p.player_id = e.player_id
LEFT JOIN {{ staging.stg_stat_types }} AS t ON t.stat = e.stat
WHERE NOT e.is_deleted
