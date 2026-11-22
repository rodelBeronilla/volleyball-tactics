-- model: dim_players
-- layer: marts
-- depends_on: staging.stg_players
-- description: One row per player ever synced. Deleted players stay (is_deleted) so historical events still join.
SELECT player_id, name, jersey_number, position, archetype, is_deleted, created_at, updated_at
FROM {{ staging.stg_players }}
