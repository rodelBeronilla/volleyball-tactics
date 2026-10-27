# ADR 0003: Snapshot sync with content hashes and soft deletes

**Status:** accepted · **Date:** 2026-10-26

## Context

The app has no server round-trips today; all state is a reducer persisted to
`localStorage`, and it already exports and imports that state as one JSON document.
Coaches record on phones at the gym, often offline. We need the server to reflect what
each device holds, including deletions, without turning the app into a client of a
remote API for every tap.

## Decision

- The app pushes its **whole dataset** (the existing export format plus a client id) a few
  seconds after any change, and on demand. No per-action endpoints, no offline queue: the
  next successful push carries everything.
- The API **normalises** the document into relational rows and computes a **content hash**
  per parent row (including its children). The bulk upsert
  (`INSERT … SELECT FROM unnest() ON CONFLICT DO UPDATE … WHERE content_hash IS DISTINCT FROM`)
  only touches rows that changed, so `updated_at` is an honest change marker and
  incremental extraction stays cheap.
- Rows present on the server but absent from the snapshot are **soft-deleted**
  (`deleted_at`), and only when the row was last written by the same client. A device can
  never delete what another device recorded. Re-sending restores them.
- Every sync is recorded (`sync_batches`), and every row that fails validation is stored
  with its reason (`sync_rejections`) and returned to the app.

## Alternatives considered

- *Event-sourced API (one request per rally)*: more "proper", but requires an offline
  queue, ordering and retry logic in the app, and still needs a reconciliation path when
  the queue and the server disagree. The snapshot is that reconciliation path, used all
  the time.
- *Diff on the client*: duplicates the server's job in JavaScript and trusts the client's
  idea of what the server holds.
- *Hard deletes*: loses history and makes the warehouse unable to see that something was
  removed.

## Consequences

- Payloads grow with the season (a few MB for ~1,000 rallies); gzip and a 25 MB cap keep
  this comfortable for years of a rec league. If it ever matters, the client id plus
  `sync_batches` give the server what it needs to accept partial snapshots scoped by match.
- Multi-device editing of the *same* match is not merged, only last-writer-wins per row.
  Documented; adequate for one coach and an assistant, revisit if the staff grows.
- Everything is idempotent: re-sending the same snapshot changes nothing, which the tests
  assert.
