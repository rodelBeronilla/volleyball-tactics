-- check: hit_pct_within_bounds
-- severity: error
-- description: Hitting percentage is between -1 and 1 and attempts are never negative (guards the box-score arithmetic).
SELECT match_id, player_id, player_name, kills, attack_errors, attack_blocked, attack_attempts, hit_pct
FROM {{ marts.agg_player_match_box }}
WHERE attack_attempts < 0 OR hit_pct < -1 OR hit_pct > 1
