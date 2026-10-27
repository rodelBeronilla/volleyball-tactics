-- check: staging_keys_are_unique
-- severity: error
-- description: De-duplication in staging leaves exactly one row per natural key.
SELECT table_name, row_id, n FROM (
  SELECT 'stg_players' AS table_name, player_id AS row_id, COUNT(*) AS n FROM {{ staging.stg_players }} GROUP BY player_id
  UNION ALL
  SELECT 'stg_matches', match_id, COUNT(*) FROM {{ staging.stg_matches }} GROUP BY match_id
  UNION ALL
  SELECT 'stg_rallies', rally_id, COUNT(*) FROM {{ staging.stg_rallies }} GROUP BY rally_id
  UNION ALL
  SELECT 'stg_stat_events', event_id, COUNT(*) FROM {{ staging.stg_stat_events }} GROUP BY event_id
  UNION ALL
  SELECT 'stg_match_sets', CONCAT(match_id, '/', CAST(set_number AS STRING)), COUNT(*) FROM {{ staging.stg_match_sets }} GROUP BY match_id, set_number
)
WHERE n > 1
