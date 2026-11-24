# Volleyball Tactics: pillar profile

Draft from the knowledge extraction on 2026-11-24; not yet agreed by the owner (TBD). Where this file and an older plan disagree, this file wins once agreed. The current state and the decisions behind it are in [state.md](state.md). This file changes only on the owner's typed line.

**Tier:** a service other people may use (coaches sync to the server API) and a public site. TBD (question: real coaches today, or portfolio viewers only?).

- Stores team data synced from coaches' browsers (players by name or jersey, matches, rallies, stat entries) in the server Postgres. Deletion: a device soft-deletes only rows it wrote itself (`docs/adr/0003-snapshot-sync-and-soft-deletes.md`). Real people's names and notes never go in the repo; the default roster is fictional (`CLAUDE.md`).
- Acts on nothing outside itself. It writes to its own Postgres and lake; the GCP half, if ever applied, writes only to its own project.
- May delete nothing by itself. Dropping tables, removing volumes and rotating credentials are the owner's (`CLAUDE.md` "Do not").

**Purpose:** a coaching tool for a 6v6 team (rotation playbook, live stat capture, analytics and lineup recommendations) and, through the data platform, a portfolio piece that shows sports-analytics data engineering. (source: handoff-volleyball-tactics.md:1, 2026-11-22; project_data_platform.md:13-15, 2026-10-26; README.md)

**Non-goals:**

- Spending money without the owner (no `terraform apply`, no paid services). (source: handoff-volleyball-tactics.md:27)
- Links to the GitHub repository inside the app. (source: handoff-volleyball-tactics.md:12)
- TBD: anything else the owner rules out.

## Priorities, in order

A higher one always wins. TBD: proposed, not agreed.

1. Never lose synced team data (the server Postgres is the system of record).
2. The live site and sync API stay up and safe (shared edge with Plex and beronilla.rodeo).
3. The app is correct for coaches (rotations, overlap rules, stat definitions identical in app and marts).
4. The platform reads well as a portfolio piece (docs, ADRs, tests).

## Who sees what

- **Public:** the app (both the live site and, until #9 is decided, the Pages copy), the demo season, `/api/healthz`, and today `/api/docs` and `/api/openapi.json` (#11).
- **Owner and token holders:** synced team data via `/api/v1/summary` and `/api/v1/batches` (bearer `SYNC_TOKEN`).
- **Never shown:** `platform/.env`, `platform/secrets/`, real league scoresheets (`platform/scoresheets/`), real rosters.

## Outcome measures

Reviewed every Monday.

- **Uptime of the site and `/api/healthz`.** Not measured yet; needs the off-host probe (#7).
- **Sync success rate.** Not measured yet; `/v1/batches` records rejected rows and Caddy logs 4xx/5xx for `/api/v1/sync`.
- **Pipeline freshness.** The pipeline's `freshness` check (`FRESHNESS_HOURS=48`); not reported anywhere yet.
- **Backup age and last restore drill.** Not measured yet (#2).

## Working rules

- **Merge:** agents never merge; the owner merges every PR (owner's global instructions). Option (a) or (b) for branch protection: TBD until the owner picks (#5).
- **Delegation:** sub-agents follow the same rules as the session, including the browser rules in `CLAUDE.md`.
- **Cost:** home server and free tiers only; anything paid is the owner's decision. (source: handoff-volleyball-tactics.md:27)
