-- model: stg_stat_event_summary_counts
-- layer: staging
-- depends_on: raw.stat_event_summary_counts, staging.stg_stat_event_summaries
-- description: Per-stat counts of each compacted summary.
SELECT c.summary_id, c.stat, c.n
FROM {{ raw.stat_event_summary_counts }} AS c
JOIN {{ staging.stg_stat_event_summaries }} AS s
  ON s.summary_id = c.summary_id AND s._batch_id = c._batch_id
