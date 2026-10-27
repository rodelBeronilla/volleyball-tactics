-- model: stg_rallies
-- layer: staging
-- depends_on: raw.rallies
-- description: Current version of every rally. Scores are the score *before* the rally.
SELECT
  id              AS rally_id,
  match_id,
  set_number,
  rally_number,
  rotation,
  serving_team,
  our_score_before,
  their_score_before,
  outcome,
  client_id,
  created_at,
  updated_at,
  deleted_at IS NOT NULL AS is_deleted,
  _batch_id
FROM {{ raw.rallies }}
QUALIFY ROW_NUMBER() OVER (PARTITION BY id ORDER BY updated_at DESC, _extracted_at DESC) = 1
