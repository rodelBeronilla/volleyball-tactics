-- check: one_team_row_per_rally
-- severity: error
-- description: Each rally has exactly one team outcome row in the event log, and it agrees with the rally's outcome.
SELECT
  r.rally_id,
  r.match_id,
  r.outcome,
  COUNT(e.event_id) AS team_rows,
  COUNTIF(e.stat = CASE WHEN r.outcome = 'won' THEN 'rallyWon' ELSE 'rallyLost' END) AS agreeing_rows
FROM {{ marts.fct_rallies }} AS r
LEFT JOIN {{ marts.fct_stat_events }} AS e ON e.rally_id = r.rally_id AND e.is_team_event
GROUP BY r.rally_id, r.match_id, r.outcome
HAVING COUNT(e.event_id) <> 1
    OR COUNTIF(e.stat = CASE WHEN r.outcome = 'won' THEN 'rallyWon' ELSE 'rallyLost' END) <> 1
