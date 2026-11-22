-- model: rec_scoresheet_players
-- layer: marts
-- depends_on: staging.stg_scoresheet_player_lines, marts.agg_player_match_box
-- description: Reconciliation of official per-player box lines against the app's box score, matched on date, opponent and jersey number. A blank scoresheet column is "not reported" and is not compared.
WITH sheet AS (
  SELECT match_date, LOWER(TRIM(opponent)) AS opp_key, opponent, player_number, player_name,
         kills, aces, blocks, digs, assists, source_file
  FROM {{ staging.stg_scoresheet_player_lines }}
),
app AS (
  SELECT match_date, LOWER(TRIM(opponent)) AS opp_key, opponent, match_id, player_id, player_name, jersey_number,
         kills, aces, blocks, digs, assists
  FROM {{ marts.agg_player_match_box }}
  WHERE jersey_number IS NOT NULL
)
SELECT
  COALESCE(s.match_date, a.match_date)          AS match_date,
  COALESCE(s.opponent, a.opponent)              AS opponent,
  COALESCE(s.player_number, a.jersey_number)    AS jersey_number,
  a.match_id,
  a.player_id,
  COALESCE(a.player_name, s.player_name)        AS player_name,
  s.source_file,
  s.kills   AS sheet_kills,   a.kills   AS app_kills,   s.kills   - a.kills   AS kills_diff,
  s.aces    AS sheet_aces,    a.aces    AS app_aces,    s.aces    - a.aces    AS aces_diff,
  s.blocks  AS sheet_blocks,  a.blocks  AS app_blocks,  s.blocks  - a.blocks  AS blocks_diff,
  s.digs    AS sheet_digs,    a.digs    AS app_digs,    s.digs    - a.digs    AS digs_diff,
  s.assists AS sheet_assists, a.assists AS app_assists, s.assists - a.assists AS assists_diff,
  CASE
    WHEN s.player_number IS NULL THEN 'missing_in_scoresheet'
    WHEN a.jersey_number IS NULL THEN 'missing_in_app'
    WHEN COALESCE(s.kills = a.kills, TRUE)
     AND COALESCE(s.aces = a.aces, TRUE)
     AND COALESCE(s.blocks = a.blocks, TRUE)
     AND COALESCE(s.digs = a.digs, TRUE)
     AND COALESCE(s.assists = a.assists, TRUE) THEN 'match'
    ELSE 'mismatch'
  END                                           AS status
FROM sheet AS s
FULL OUTER JOIN app AS a
  ON a.match_date = s.match_date AND a.opp_key = s.opp_key AND a.jersey_number = s.player_number
