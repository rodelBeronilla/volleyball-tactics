-- check: freshness
-- severity: warn
-- description: The newest loaded extract is no older than the freshness SLA (FRESHNESS_HOURS).
SELECT MAX(extracted_at) AS newest_extract, CURRENT_TIMESTAMP() AS checked_at
FROM {{ raw.etl_batches }}
HAVING MAX(extracted_at) IS NULL
    OR MAX(extracted_at) < TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL {{ freshness_hours }} HOUR)
