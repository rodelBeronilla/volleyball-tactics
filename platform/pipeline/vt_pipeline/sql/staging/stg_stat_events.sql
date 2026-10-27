-- model: stg_stat_events
-- layer: staging
-- depends_on: raw.stat_events
-- description: Current version of every event in the flat log (one row per touch, plus one team row per rally).
SELECT
  id            AS event_id,
  match_id,
  set_number,
  rally_id,
  player_id,
  is_team_event,
  rotation,
  stat,
  serving_team,
  event_ts,
  video_ts,
  client_id,
  created_at,
  updated_at,
  deleted_at IS NOT NULL AS is_deleted,
  _batch_id
FROM {{ raw.stat_events }}
QUALIFY ROW_NUMBER() OVER (PARTITION BY id ORDER BY updated_at DESC, _extracted_at DESC) = 1
