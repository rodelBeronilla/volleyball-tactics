-- model: stg_scoresheet_sets
-- layer: staging
-- depends_on: raw.scoresheet_sets
-- description: Official set scores from league scoresheets, latest copy of each CSV file.
SELECT source_file, row_number, match_date, opponent, set_number, our_score, their_score, _extracted_at AS received_at
FROM {{ raw.scoresheet_sets }}
QUALIFY _extracted_at = MAX(_extracted_at) OVER (PARTITION BY source_file)
