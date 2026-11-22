-- check: serve_events_only_when_serving
-- severity: error
-- description: Aces, service errors and serves in play only occur in rallies we served.
SELECT e.event_id, e.rally_id, e.match_id, e.player_id, e.stat, r.serving_team
FROM {{ marts.fct_stat_events }} AS e
JOIN {{ marts.fct_rallies }} AS r ON r.rally_id = e.rally_id
WHERE e.stat IN ('ace', 'serviceError', 'serveInPlay')
  AND r.serving_team <> 'us'
