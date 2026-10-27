-- check: kills_have_assists
-- severity: warn
-- description: In rally-by-rally data every kill normally comes with a setter assist; a difference usually means a touch was not recorded (or a legitimate overpass kill).
SELECT
  rally_id,
  COUNTIF(stat IN ('kill', 'attackTip', 'attackTooled')) AS kills,
  COUNTIF(stat = 'assist')                               AS assists
FROM {{ staging.stg_rally_actions }}
GROUP BY rally_id
HAVING COUNTIF(stat IN ('kill', 'attackTip', 'attackTooled')) <> COUNTIF(stat = 'assist')
