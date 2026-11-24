# Deploy and rollback: volleyball-tactics

The exact commands for the live server (`https://volleyballtactics.beronilla.rodeo`, Docker Compose project `volleyball-tactics` on the home server, behind the plex-stack Caddy). Rehearsed once to reach L2; record the rehearsal date here and in `.sdlc/factory.yml` (`backup.restore_tested` for restores).

Last rehearsed: never.

Today the deploy is a manual rebuild that tags images `:local`, so the live code cannot be tied to a commit and the only rollback is rebuilding an older checkout. `scripts/deploy.ps1` (images tagged by git SHA, `-Sha <previous>` to roll back) is #4; replace the commands below when it lands. Running any of this touches production: do it only on the owner's go (`CLAUDE.md` "How work ships"). (source: baseline volleyball-tactics.md §1 "How files get there", 2026-11-23)

## Preconditions

- The SHA to deploy is merged on `main` and its checks are green (`gh run list -b main -L 5`).
- The working tree is a clean checkout of that SHA (`git status --porcelain` prints nothing).
- `platform/.env` exists on the server with `COMPOSE_FILE=compose.yaml;compose.shared-proxy.yaml` and `PROXY_NETWORK=shared-proxy` (names only; values are secret). Never edit `SYNC_TOKEN` or `POSTGRES_PASSWORD` as part of a deploy.
- A fresh `pg_dump` exists (see "Restore from backup"). Until #2 lands, take one by hand first.
- Never `docker compose down -v`: it deletes `pgdata`, the system of record.
- Window: TBD (none agreed).

## Deploy

From the clean checkout, in PowerShell:

```
git rev-parse HEAD                         # write this SHA down: it is what goes live
docker image ls vt-web; docker image ls vt-api; docker image ls vt-pipeline   # note the current image IDs for rollback
cd platform
docker tag vt-web:local vt-web:prev; docker tag vt-api:local vt-api:prev; docker tag vt-pipeline:local vt-pipeline:prev
docker compose -f compose.yaml -f compose.shared-proxy.yaml up -d --build
```

The API applies forward-only SQL migrations on start (`vt-api migrate`). A migration cannot be rolled back by swapping images; read `platform/api/vt_api/migrations/` in the diff before deploying.

## Verify

```
docker compose -p volleyball-tactics ps                       # web, api, postgres healthy; pipeline Up
curl -s http://localhost:8080/healthz                         # {"status":"ok",...}
curl -s -o NUL -w "%{http_code}`n" http://localhost:8088/     # 200
curl -s -o NUL -w "%{http_code}`n" https://volleyballtactics.beronilla.rodeo/              # 200
curl -s https://volleyballtactics.beronilla.rodeo/api/healthz                               # {"status":"ok",...}
docker compose -p volleyball-tactics logs --since 20m pipeline   # next run (every 15 min) logs no failed step
```

Pass means: all three app containers healthy, both public URLs answer as shown, and the next pipeline run succeeds. If any check fails, roll back first, then investigate.

## Rollback

```
cd platform
docker tag vt-web:prev vt-web:local; docker tag vt-api:prev vt-api:local; docker tag vt-pipeline:prev vt-pipeline:local
docker compose -f compose.yaml -f compose.shared-proxy.yaml up -d --no-build
```

Then run "Verify" again. If no `:prev` tags exist (the deploy skipped that step), check out the previous SHA (`git log --first-parent main`) in a clean checkout and run "Deploy" from it. A migration that already ran stays applied; restore from backup only on the owner's go.

How to find the previous SHA: today, not recorded anywhere (that is #4). Use `git log --first-parent main` and the image creation time (`docker image inspect vt-api:local -f "{{.Created}}"`).

## Live-only state touched by a deploy

- **Containers and images**: replaced; reversible with the `:prev` tags.
- **Postgres schema**: migrations run on API start; forward-only, not reversible by rollback.
- **Volumes `pgdata`, `lake`**: kept across `up -d`; destroyed only by `down -v` (never).
- **Caddy vhost**: not touched by an app deploy. When `platform/edge/existing-caddy.caddy` changes, copy it to plex-stack `config/caddy/sites.d/volleyballtactics.caddy`, then:

  ```
  docker exec caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
  docker exec caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
  ```

  Reload only after validate passes (that Caddy also serves Plex and beronilla.rodeo). Never edit plex-stack's own Caddyfile. Undo: copy the previous file back, validate, reload. The file is git-ignored in plex-stack, so keep the previous copy before overwriting. Under the factory plan only the deploy job reloads Caddy, and vhost changes go through a plex-stack PR. (source: handoff-volleyball-tactics.md:14,30, 2026-11-22; platform/edge/existing-caddy.caddy:1-9)

## Restore from backup

Backups do not exist yet (#2); `docs/platform/deploy-server.md` "Backups" describes the intended dump. Take one by hand:

(Dump inside the container and copy it out: a PowerShell 5.1 `>` redirect would re-encode the dump as UTF-16.)

```
docker compose -p volleyball-tactics exec -T postgres pg_dump -U vt -Fc -f /tmp/vt.dump vt
docker cp volleyball-tactics-postgres-1:/tmp/vt.dump .\vt-<date>.dump
```

Restore (owner's go only; drill into a scratch Postgres first):

```
docker cp .\vt-<date>.dump volleyball-tactics-postgres-1:/tmp/vt.dump
docker compose -p volleyball-tactics exec -T postgres pg_restore -U vt -d vt --clean --if-exists /tmp/vt.dump
```

Then reset the pipeline watermarks (`UPDATE etl_watermarks SET watermark = '1970-01-01'`) so the next extract re-ships everything; the warehouse de-duplicates (`docs/platform/runbook.md` "Restoring Postgres"). Where backups live: TBD (#2).
