-- model: stg_lineups
-- layer: staging
-- depends_on: raw.lineups
-- description: Current version of every lineup.
SELECT
  id        AS lineup_id,
  name,
  system,
  libero_id,
  overrides,
  client_id,
  created_at,
  updated_at,
  deleted_at IS NOT NULL AS is_deleted,
  _batch_id
FROM {{ raw.lineups }}
QUALIFY ROW_NUMBER() OVER (PARTITION BY id ORDER BY updated_at DESC, _extracted_at DESC) = 1
