-- check: rotation_in_range
-- severity: error
-- description: Rotations are 1 to 6 on every rally and every event that has one.
SELECT 'rallies' AS table_name, rally_id AS row_id, rotation
FROM {{ staging.stg_rallies }}
WHERE NOT is_deleted AND (rotation IS NULL OR rotation < 1 OR rotation > 6)
UNION ALL
SELECT 'stat_events', event_id, rotation
FROM {{ staging.stg_stat_events }}
WHERE NOT is_deleted AND rotation IS NOT NULL AND (rotation < 1 OR rotation > 6)
