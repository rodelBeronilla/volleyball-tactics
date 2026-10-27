-- model: dim_matches
-- layer: marts
-- depends_on: staging.stg_matches, staging.stg_match_sets, staging.stg_lineups
-- description: One row per active match with lineup and set-level result. result is W/L for completed matches, else NULL.
WITH sets AS (
  SELECT
    match_id,
    COUNT(*)                 AS sets_played,
    COUNTIF(won = TRUE)      AS sets_won,
    COUNTIF(won = FALSE)     AS sets_lost
  FROM {{ staging.stg_match_sets }}
  GROUP BY match_id
)
SELECT
  m.match_id,
  m.opponent,
  m.match_date,
  EXTRACT(YEAR FROM m.match_date) AS season,
  m.lineup_id,
  l.name                          AS lineup_name,
  l.system                        AS lineup_system,
  m.completed,
  COALESCE(s.sets_played, 0)      AS sets_played,
  COALESCE(s.sets_won, 0)         AS sets_won,
  COALESCE(s.sets_lost, 0)        AS sets_lost,
  CASE
    WHEN NOT m.completed THEN NULL
    WHEN COALESCE(s.sets_won, 0) > COALESCE(s.sets_lost, 0) THEN 'W'
    WHEN COALESCE(s.sets_won, 0) < COALESCE(s.sets_lost, 0) THEN 'L'
    ELSE 'D'
  END                             AS result,
  m.created_at,
  m.updated_at
FROM {{ staging.stg_matches }} AS m
LEFT JOIN {{ staging.stg_lineups }} AS l ON l.lineup_id = m.lineup_id
LEFT JOIN sets AS s ON s.match_id = m.match_id
WHERE NOT m.is_deleted
