-- check: jersey_numbers_are_unique
-- severity: warn
-- description: No two active players share a jersey number (scoresheets are matched on it).
SELECT jersey_number, COUNT(*) AS players, STRING_AGG(name, ', ') AS names
FROM {{ staging.stg_players }}
WHERE NOT is_deleted AND jersey_number IS NOT NULL
GROUP BY jersey_number
HAVING COUNT(*) > 1
