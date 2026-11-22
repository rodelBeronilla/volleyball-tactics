-- model: stg_matches
-- layer: staging
-- depends_on: raw.matches
-- description: Current version of every match.
SELECT
  id          AS match_id,
  opponent,
  match_date,
  lineup_id,
  completed,
  client_id,
  created_at,
  updated_at,
  deleted_at IS NOT NULL AS is_deleted,
  _batch_id
FROM {{ raw.matches }}
QUALIFY ROW_NUMBER() OVER (PARTITION BY id ORDER BY updated_at DESC, _extracted_at DESC) = 1
