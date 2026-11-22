-- 001_init.sql — operational schema for Volleyball Tactics.
--
-- This database is the system of record on the coach's own server. The web
-- app pushes snapshots to POST /v1/sync; the pipeline reads changed rows by
-- updated_at and ships them to the warehouse.
--
-- Conventions
--   * Natural keys are the app's own ids (text), so warehouse rows join
--     straight back to what a coach sees on screen.
--   * Every synced table carries: client_id (device that last wrote the row),
--     content_hash (change detection: updated_at only moves on real change),
--     created_at / updated_at / deleted_at. Rows are never hard-deleted;
--     deleted_at marks them so downstream consumers can see the deletion.
--   * Child tables (lineup_slots, match_sets, rally_actions,
--     stat_event_summary_counts) are replaced as a unit whenever the parent's
--     content_hash changes. They are versioned through the parent.

-- ── Reference data ─────────────────────────────────────────────────────────

CREATE TABLE stat_types (
    stat        text PRIMARY KEY,
    label       text NOT NULL,
    stat_group  text NOT NULL,
    positive    boolean NOT NULL,
    attribute   text
);
COMMENT ON TABLE stat_types IS
  'Event vocabulary (kill, ace, passPerfect, ...). Mirrors src/data/statCategories.js in the app.';

-- ── Roster and lineups ─────────────────────────────────────────────────────

CREATE TABLE players (
    id              text PRIMARY KEY,
    name            text NOT NULL,
    number          integer,
    position        text NOT NULL
                    CHECK (position IN ('setter', 'outside', 'middle', 'opposite', 'libero', 'ds')),
    base_ratings    jsonb,          -- coach ratings 1-10 per attribute, if entered
    archetype       text,
    rating_history  jsonb,          -- [{date, ratings, source}]
    content_hash    text NOT NULL,
    client_id       text NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz
);
CREATE INDEX players_updated_at_idx ON players (updated_at);

CREATE TABLE lineups (
    id              text PRIMARY KEY,
    name            text NOT NULL,
    system          text NOT NULL,  -- '5-1', '4-2', ...
    libero_id       text REFERENCES players (id),
    overrides       jsonb,          -- per-rotation court position overrides {r1: {slot: {x, y}}}
    content_hash    text NOT NULL,
    client_id       text NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz
);
CREATE INDEX lineups_updated_at_idx ON lineups (updated_at);

CREATE TABLE lineup_slots (
    lineup_id   text NOT NULL REFERENCES lineups (id) ON DELETE CASCADE,
    slot        smallint NOT NULL CHECK (slot BETWEEN 1 AND 6),
    player_id   text REFERENCES players (id),
    PRIMARY KEY (lineup_id, slot)
);
COMMENT ON TABLE lineup_slots IS
  'Starting slot 1-6 for rotation 1. Rotations 2-6 are derived, never stored (see utils/rotations.js).';

-- ── Matches ────────────────────────────────────────────────────────────────

CREATE TABLE matches (
    id                  text PRIMARY KEY,
    opponent            text NOT NULL,
    match_date          date NOT NULL,
    lineup_id           text,       -- soft reference: lineups can be deleted in the app after a match
    completed           boolean NOT NULL DEFAULT false,
    night_plan_set_ref  jsonb,
    content_hash        text NOT NULL,
    client_id           text NOT NULL,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    deleted_at          timestamptz
);
CREATE INDEX matches_updated_at_idx ON matches (updated_at);
CREATE INDEX matches_date_idx ON matches (match_date);

CREATE TABLE match_sets (
    match_id    text NOT NULL REFERENCES matches (id) ON DELETE CASCADE,
    set_number  smallint NOT NULL CHECK (set_number >= 1),
    our_score   smallint NOT NULL CHECK (our_score >= 0),
    their_score smallint NOT NULL CHECK (their_score >= 0),
    won         boolean,            -- NULL while the set is in progress
    PRIMARY KEY (match_id, set_number)
);

-- ── Play by play ───────────────────────────────────────────────────────────

CREATE TABLE rallies (
    id                  text PRIMARY KEY,
    match_id            text NOT NULL REFERENCES matches (id),
    set_number          smallint NOT NULL CHECK (set_number >= 1),
    rally_number        integer NOT NULL CHECK (rally_number >= 1),
    rotation            smallint NOT NULL CHECK (rotation BETWEEN 1 AND 6),
    serving_team        text NOT NULL CHECK (serving_team IN ('us', 'them')),
    our_score_before    smallint NOT NULL CHECK (our_score_before >= 0),
    their_score_before  smallint NOT NULL CHECK (their_score_before >= 0),
    outcome             text NOT NULL CHECK (outcome IN ('won', 'lost')),
    content_hash        text NOT NULL,
    client_id           text NOT NULL,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    deleted_at          timestamptz
);
CREATE INDEX rallies_match_idx ON rallies (match_id, set_number, rally_number);
CREATE INDEX rallies_updated_at_idx ON rallies (updated_at);

CREATE TABLE rally_actions (
    rally_id        text NOT NULL REFERENCES rallies (id) ON DELETE CASCADE,
    action_order    smallint NOT NULL CHECK (action_order >= 1),
    player_id       text NOT NULL REFERENCES players (id),
    stat            text NOT NULL REFERENCES stat_types (stat),
    PRIMARY KEY (rally_id, action_order)
);

-- The flat event log the app's analytics run on: one row per touch plus one
-- team row per rally (is_team_event, stat rallyWon/rallyLost). Events recorded
-- with the quick-tap screen have no rally_id.
CREATE TABLE stat_events (
    id              text PRIMARY KEY,
    match_id        text NOT NULL REFERENCES matches (id),
    set_number      smallint NOT NULL CHECK (set_number >= 1),
    rally_id        text REFERENCES rallies (id),
    player_id       text REFERENCES players (id),
    is_team_event   boolean NOT NULL DEFAULT false,
    rotation        smallint CHECK (rotation BETWEEN 1 AND 6),
    stat            text NOT NULL REFERENCES stat_types (stat),
    serving_team    text CHECK (serving_team IN ('us', 'them')),
    event_ts        timestamptz,
    video_ts        double precision,   -- seconds into the video, for video-review entries
    content_hash    text NOT NULL,
    client_id       text NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz,
    CHECK (is_team_event = (player_id IS NULL))
);
CREATE INDEX stat_events_match_idx ON stat_events (match_id, set_number);
CREATE INDEX stat_events_player_idx ON stat_events (player_id);
CREATE INDEX stat_events_rally_idx ON stat_events (rally_id);
CREATE INDEX stat_events_updated_at_idx ON stat_events (updated_at);

-- Compaction output from the app (Team → Data → Compact): per player, per
-- rotation counts for old matches whose individual events were dropped.
CREATE TABLE stat_event_summaries (
    id              text PRIMARY KEY,
    match_id        text NOT NULL REFERENCES matches (id),
    player_id       text REFERENCES players (id),
    rotation        smallint CHECK (rotation BETWEEN 1 AND 6),
    set_numbers     jsonb NOT NULL,     -- [1, 2, 3]
    content_hash    text NOT NULL,
    client_id       text NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz
);
CREATE INDEX stat_event_summaries_updated_at_idx ON stat_event_summaries (updated_at);

CREATE TABLE stat_event_summary_counts (
    summary_id  text NOT NULL REFERENCES stat_event_summaries (id) ON DELETE CASCADE,
    stat        text NOT NULL REFERENCES stat_types (stat),
    n           integer NOT NULL CHECK (n >= 0),
    PRIMARY KEY (summary_id, stat)
);

-- ── Game night plans (stored as documents; not modelled further yet) ───────

CREATE TABLE night_plans (
    id              text PRIMARY KEY,
    name            text,
    plan_date       date,
    plan            jsonb NOT NULL,
    content_hash    text NOT NULL,
    client_id       text NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz
);
CREATE INDEX night_plans_updated_at_idx ON night_plans (updated_at);

-- ── Ingest provenance ──────────────────────────────────────────────────────

CREATE TABLE sync_batches (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id       text NOT NULL,
    app_version     text,
    received_at     timestamptz NOT NULL DEFAULT now(),
    payload_sha256  text NOT NULL,
    row_counts      jsonb NOT NULL,     -- rows per table in the payload
    changes         jsonb NOT NULL,     -- {table: {inserted, updated, deleted}}
    rejected_count  integer NOT NULL DEFAULT 0,
    duration_ms     integer
);
CREATE INDEX sync_batches_received_at_idx ON sync_batches (received_at);

CREATE TABLE sync_rejections (
    batch_id    uuid NOT NULL REFERENCES sync_batches (id) ON DELETE CASCADE,
    table_name  text NOT NULL,
    row_id      text,
    reason      text NOT NULL,
    row         jsonb
);
CREATE INDEX sync_rejections_batch_idx ON sync_rejections (batch_id);
COMMENT ON TABLE sync_rejections IS
  'Rows a sync could not store (unknown player, unknown stat type, ...). Kept for triage; never silently dropped.';

-- ── Pipeline bookkeeping ───────────────────────────────────────────────────

CREATE TABLE etl_watermarks (
    table_name  text PRIMARY KEY,
    watermark   timestamptz NOT NULL,
    batch_id    text,
    updated_at  timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE etl_watermarks IS 'High-water mark (max updated_at shipped) per table for incremental extraction.';
