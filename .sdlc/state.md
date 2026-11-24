# Project state: Volleyball Tactics

Last rewritten: 2026-11-24. Update it after anything that changes what is in flight, what waits on the owner, or a decision below. History belongs in git, the ADRs and the issues, not here. The collector warns when this file is 7 days old and files an issue at 14.

Read with it: [pillars.md](pillars.md) for what wins when priorities collide, and `CLAUDE.md` for how a change ships.

## What this is

A React coaching app (rotation playbook, rally-by-rally stat capture, analytics) plus a hybrid data platform: a sync API and Postgres system of record on the owner's home server, a 15-minute pipeline into a Parquet lake and DuckDB, and an unapplied GCP design (GCS, BigQuery, Cloud Run). Live at `https://volleyballtactics.beronilla.rodeo` (app at `/`, API at `/api`), from Docker Compose project `volleyball-tactics` on the home server behind the plex-stack Caddy. A secondary public copy of the app is on GitHub Pages. Default branch `main`. Who uses it beyond the owner is TBD (question: real coaches syncing, or portfolio viewers only?). (source: handoff-volleyball-tactics.md:1,6, 2026-11-22; baseline volleyball-tactics.md §1, §3, 2026-11-23)

## Decisions in force

Recorded here so they are not re-asked. The date is when it was recorded; the source is where it was found.

- **Do the work; hand the owner only what needs him (2026-11-22).** DNS, accounts, money. He said so explicitly. (source: handoff-volleyball-tactics.md:11)
- **No GitHub repo links inside the app (2026-11-22).** Removed in 7684aa4; do not add back. The README is not the app; its links are part of #9. (source: handoff-volleyball-tactics.md:12)
- **Hosting (2026-11-22).** `volleyballtactics.beronilla.rodeo` through the plex-stack Caddy; the owner created the Cloudflare record (a proxied CNAME to toli.mov). (source: handoff-volleyball-tactics.md:13)
- **Network (2026-11-22).** Containers join `shared-proxy`, never `media-net` (plex-stack #418 / PR #419). (source: handoff-volleyball-tactics.md:14)
- **Edge (2026-11-22).** Never append to plex-stack's Caddyfile; this product edits only `sites.d/volleyballtactics.caddy`, validates, then reloads with `--adapter caddyfile`. (source: handoff-volleyball-tactics.md:14)
- **Do-not list (2026-11-22).** In `CLAUDE.md` "Do not, without the owner's typed approval". (source: handoff-volleyball-tactics.md:25-32)
- **Browser rules (2026-11-17).** In `CLAUDE.md` "Using the owner's browser", from the owner's own message. (source: handoff-volleyball-tactics.md:34-41)
- **PRs (2026-11-24).** The handoff said "ask before opening a PR"; the owner's global instructions say all work goes on a feature branch into a PR, which agents open and he merges. The owner's instructions win. (source: handoff-volleyball-tactics.md:28; owner's global instructions)
- **Data platform shape (2026-10-26).** One pipeline, two targets (`PIPELINE_TARGET=local` DuckDB / `gcp` BigQuery), same SQL in BigQuery dialect; see `docs/adr/0001-0003`. Built to show data-engineering work for a sports-analytics data-engineer role. (source: project_data_platform.md:13-21)

## Live-only settings

Settings that exist only on the running system, not in this repo.

- **`platform/.env` on the server** = secret: keys `POSTGRES_PASSWORD`, `SYNC_TOKEN`, `SITE_DOMAIN`, `CORS_ORIGINS`, `COMPOSE_FILE`, `PROXY_NETWORK`, `PIPELINE_TARGET` (names from `platform/.env.example`; values never in the repo). Stays live-only by design. (source: baseline volleyball-tactics.md §3)
- **Running images** = `vt-web:local` (built 2026-11-03), `vt-api:local`, `vt-pipeline:local` (2026-11-03); containers started 2026-11-18. Not traceable to a commit; plan in #4. (source: baseline volleyball-tactics.md §1)
- **Caddy vhost** = plex-stack `config/caddy/sites.d/volleyballtactics.caddy`, identical to `platform/edge/existing-caddy.caddy` on 2026-11-23, but git-ignored in plex-stack (`.gitignore:57`, re-checked 2026-11-24 with `git check-ignore`), so this repo holds the only versioned copy. Tracking it in plex-stack belongs to the plex-stack repo. (source: baseline volleyball-tactics.md §1 "Caddy vhost")
- **Cloudflare DNS** = proxied CNAME `volleyballtactics.beronilla.rodeo` -> toli.mov, created by the owner. Live headers show no Cloudflare markers, so whether the proxy is on is TBD (question). The Cloudflare token lives in plex-stack's `.env` and is scoped to the toli.mov zone. (source: handoff-volleyball-tactics.md:13,31; baseline volleyball-tactics.md GAPS 3)
- **GitHub Pages** = enabled, deployed by `deploy.yml` on every push to `main`. Decision pending in #9.
- **Volumes** = `volleyball-tactics_pgdata` (system of record), `volleyball-tactics_lake`. Single copies, no backup (#2).

## The plan

1. Make `main` green again (#3).
2. Back up Postgres and the lake, then test a restore (#2).
3. Deploy by SHA with a scripted rollback (#4), then rehearse `docs/runbooks/deploy-rollback.md`.
4. Merge rule and branch protection (#5); off-host monitoring (#7).
5. Then dependencies (#6), CSP (#8), token design (#11), dev hygiene (#12).

## In flight

- Nothing mid-change. PR #1 (data platform and app sync) merged 2026-11-22 as a77a595; the next work starts on a fresh branch off `main`. The owner's local checkout is still on the merged branch `claude/affectionate-carson-ulfbgc` (9bfaed9, pushed, contained in `main`, nothing unpushed or uncommitted, re-checked 2026-11-24). (source: handoff-volleyball-tactics.md:5)
- Timed work: none. (source: handoff-volleyball-tactics.md:23)

## Waiting on the owner

- Keep or take down the public GitHub Pages copy, since 2026-11-22. (#9)
- Whether the GCP half is wanted, and a project id if so, since 2026-11-22. (#10)
- Backup destination and retention. (#2)
- Merge rule (a or b) and branch protection on `main`. (#5)

## Known debt

- Platform CI is red on `main` from a flaky test (#3).
- `docs/platform/deploy-server.md` "Backups" promises a `pg_dump` cron that does not exist (#2).
- 14 npm advisories, 1 critical (#6). No CSP (#8). No off-host monitoring (#7).
- Large untested units: `src/hooks/useAppState.js` (one ~590-line reducer), `storageManager.js`, the two single-file tools in `public/tools/`. (source: baseline volleyball-tactics.md §4.4)
