-- model: stg_stat_event_summary_sets
-- layer: staging
-- depends_on: raw.stat_event_summary_sets, staging.stg_stat_event_summaries
-- description: Which sets each compacted summary covers (one row per summary and set).
SELECT x.summary_id, x.set_number
FROM {{ raw.stat_event_summary_sets }} AS x
JOIN {{ staging.stg_stat_event_summaries }} AS s
  ON s.summary_id = x.summary_id AND s._batch_id = x._batch_id
