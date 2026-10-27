-- model: stg_lineup_slots
-- layer: staging
-- depends_on: raw.lineup_slots, staging.stg_lineups
-- description: Slot 1-6 assignments of the current version of each lineup (children are versioned through the parent's batch).
SELECT s.lineup_id, s.slot, s.player_id
FROM {{ raw.lineup_slots }} AS s
JOIN {{ staging.stg_lineups }} AS l
  ON l.lineup_id = s.lineup_id AND l._batch_id = s._batch_id
