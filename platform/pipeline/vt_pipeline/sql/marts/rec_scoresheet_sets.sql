-- model: rec_scoresheet_sets
-- layer: marts
-- depends_on: staging.stg_scoresheet_sets, marts.agg_team_set_results
-- description: Reconciliation of official scoresheet set scores against the app's recorded sets, matched on date, opponent and set number.
WITH sheet AS (
  SELECT match_date, LOWER(TRIM(opponent)) AS opp_key, opponent, set_number,
         our_score AS sheet_our_score, their_score AS sheet_their_score, source_file
  FROM {{ staging.stg_scoresheet_sets }}
),
app AS (
  SELECT match_date, LOWER(TRIM(opponent)) AS opp_key, opponent, match_id, set_number,
         our_score AS app_our_score, their_score AS app_their_score
  FROM {{ marts.agg_team_set_results }}
)
SELECT
  COALESCE(s.match_date, a.match_date)   AS match_date,
  COALESCE(s.opponent, a.opponent)       AS opponent,
  COALESCE(s.set_number, a.set_number)   AS set_number,
  a.match_id,
  s.source_file,
  s.sheet_our_score,
  s.sheet_their_score,
  a.app_our_score,
  a.app_their_score,
  s.sheet_our_score - a.app_our_score     AS our_score_diff,
  s.sheet_their_score - a.app_their_score AS their_score_diff,
  CASE
    WHEN s.set_number IS NULL THEN 'missing_in_scoresheet'
    WHEN a.set_number IS NULL THEN 'missing_in_app'
    WHEN s.sheet_our_score = a.app_our_score AND s.sheet_their_score = a.app_their_score THEN 'match'
    ELSE 'mismatch'
  END                                    AS status
FROM sheet AS s
FULL OUTER JOIN app AS a
  ON a.match_date = s.match_date AND a.opp_key = s.opp_key AND a.set_number = s.set_number
