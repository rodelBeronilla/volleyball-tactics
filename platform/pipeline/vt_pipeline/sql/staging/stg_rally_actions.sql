-- model: stg_rally_actions
-- layer: staging
-- depends_on: raw.rally_actions, staging.stg_rallies
-- description: Ordered touches of the current version of each rally.
SELECT a.rally_id, a.action_order, a.player_id, a.stat
FROM {{ raw.rally_actions }} AS a
JOIN {{ staging.stg_rallies }} AS r
  ON r.rally_id = a.rally_id AND r._batch_id = a._batch_id
