-- model: stg_stat_types
-- layer: staging
-- depends_on: raw.stat_types
-- description: Event vocabulary (kill, ace, passPerfect, ...) from the latest extract.
SELECT stat, label, stat_group, positive, attribute
FROM {{ raw.stat_types }}
QUALIFY _extracted_at = MAX(_extracted_at) OVER ()
