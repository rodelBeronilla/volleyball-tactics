-- check: events_reference_known_player
-- severity: error
-- description: Every player event names a player that exists (team rows excepted).
SELECT e.event_id, e.match_id, e.player_id, e.stat
FROM {{ staging.stg_stat_events }} AS e
LEFT JOIN {{ staging.stg_players }} AS p ON p.player_id = e.player_id
WHERE NOT e.is_deleted AND NOT e.is_team_event AND p.player_id IS NULL
