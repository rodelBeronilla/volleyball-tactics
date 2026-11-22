-- check: events_and_rallies_reference_known_match
-- severity: error
-- description: Every active event and rally belongs to a match that exists.
SELECT 'stat_events' AS table_name, e.event_id AS row_id, e.match_id
FROM {{ staging.stg_stat_events }} AS e
LEFT JOIN {{ staging.stg_matches }} AS m ON m.match_id = e.match_id
WHERE NOT e.is_deleted AND m.match_id IS NULL
UNION ALL
SELECT 'rallies' AS table_name, r.rally_id AS row_id, r.match_id
FROM {{ staging.stg_rallies }} AS r
LEFT JOIN {{ staging.stg_matches }} AS m ON m.match_id = r.match_id
WHERE NOT r.is_deleted AND m.match_id IS NULL
