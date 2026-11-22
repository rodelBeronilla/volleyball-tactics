-- model: stg_stat_event_summaries
-- layer: staging
-- depends_on: raw.stat_event_summaries
-- description: Compacted per-player, per-rotation counts the app writes for old matches (Team → Data → Compact).
SELECT
  id            AS summary_id,
  match_id,
  player_id,
  rotation,
  client_id,
  updated_at,
  deleted_at IS NOT NULL AS is_deleted,
  _batch_id
FROM {{ raw.stat_event_summaries }}
QUALIFY ROW_NUMBER() OVER (PARTITION BY id ORDER BY updated_at DESC, _extracted_at DESC) = 1
