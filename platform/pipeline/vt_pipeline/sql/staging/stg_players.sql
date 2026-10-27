-- model: stg_players
-- layer: staging
-- depends_on: raw.players
-- description: Current version of every player (latest updated_at wins). is_deleted marks soft deletes; marts filter on it.
SELECT
  id            AS player_id,
  name,
  number        AS jersey_number,
  position,
  archetype,
  base_ratings,
  client_id,
  created_at,
  updated_at,
  deleted_at IS NOT NULL AS is_deleted,
  _batch_id
FROM {{ raw.players }}
QUALIFY ROW_NUMBER() OVER (PARTITION BY id ORDER BY updated_at DESC, _extracted_at DESC) = 1
