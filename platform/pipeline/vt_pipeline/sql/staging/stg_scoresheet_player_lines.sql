-- model: stg_scoresheet_player_lines
-- layer: staging
-- depends_on: raw.scoresheet_player_lines
-- description: Official per-player box lines from league scoresheets, latest copy of each CSV file.
SELECT source_file, row_number, match_date, opponent, player_number, player_name,
       kills, aces, blocks, digs, assists, _extracted_at AS received_at
FROM {{ raw.scoresheet_player_lines }}
QUALIFY _extracted_at = MAX(_extracted_at) OVER (PARTITION BY source_file)
