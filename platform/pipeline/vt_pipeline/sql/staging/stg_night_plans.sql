-- model: stg_night_plans
-- layer: staging
-- depends_on: raw.night_plans
-- description: Current version of every game-night plan (kept as a JSON document; not modelled further yet).
SELECT
  id          AS night_plan_id,
  name,
  plan_date,
  plan,
  client_id,
  created_at,
  updated_at,
  deleted_at IS NOT NULL AS is_deleted,
  _batch_id
FROM {{ raw.night_plans }}
QUALIFY ROW_NUMBER() OVER (PARTITION BY id ORDER BY updated_at DESC, _extracted_at DESC) = 1
