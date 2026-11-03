# Deploying on your server

What you get: Postgres (system of record), the sync API, the web app and the pipeline loop,
all as containers, published on one HTTPS name: the app at `https://SITE_DOMAIN/` and the
API at `https://SITE_DOMAIN/api`. Optionally Metabase for dashboards.

Requirements: Docker with the Compose plugin, a DNS name pointing at the server if the
app should reach it from outside your network (recommended; the app runs on phones).

## 1. Configure

```bash
cd platform
cp .env.example .env
openssl rand -hex 32          # paste as SYNC_TOKEN
```

Edit `.env`:

| Variable | Set to |
| --- | --- |
| `POSTGRES_PASSWORD` | anything strong |
| `SYNC_TOKEN` | the generated secret; coaches type it once into the app |
| `CORS_ORIGINS` | every origin the app is served from, comma-separated: `https://rodelberonilla.github.io`, the Cloud Run URL, `http://localhost:5173` for development |
| `SITE_DOMAIN` | the public name, e.g. `volleyballtactics.beronilla.rodeo`; baked into the web build as the API URL |
| `COMPOSE_FILE`, `PROXY_NETWORK` | only when the server already runs a reverse proxy (see below) |
| `PIPELINE_TARGET` | `local` to start; `gcp` after [deploy-gcp.md](deploy-gcp.md) |

## 2. Start

```bash
docker compose up -d --build                 # postgres, api, web, pipeline (ports on 127.0.0.1 only)
docker compose logs -f api pipeline
curl -s http://localhost:8080/healthz        # {"status":"ok","version":"0.1.0"}
curl -s -o /dev/null -w "%{http_code}
" http://localhost:8088/   # the web app
```

Then publish it, in one of two ways:

- **The server already has a reverse proxy on 80/443** (this server: the plex-stack Caddy on
  `media-net`). Set `COMPOSE_FILE=compose.yaml;compose.shared-proxy.yaml` (`:` on Linux) and
  `PROXY_NETWORK` in `.env`, so api and web join that network as `vt-api` and `vt-web`.
  Create the DNS record, then append [`platform/edge/existing-caddy.caddy`](../../platform/edge/existing-caddy.caddy)
  to the proxy's Caddyfile and `docker exec caddy caddy reload --config /etc/caddy/Caddyfile`.
  DNS first: Caddy requests the certificate as soon as the block loads.
- **Nothing else listens on 80/443**: `docker compose --profile edge up -d` starts this
  project's own Caddy ([`platform/edge/Caddyfile`](../../platform/edge/Caddyfile)) with an
  automatic certificate for `SITE_DOMAIN`.

The API applies its SQL migrations on start (`vt-api migrate`), safely even with several
replicas. The pipeline runs every `PIPELINE_INTERVAL_SECONDS` (15 minutes by default) and
logs one JSON line per step.

No public domain? Alternatives that need no open inbound port: a Cloudflare Tunnel or
Tailscale Funnel in front of `web:8080` and `api:8080`. The app only needs an HTTPS URL it can reach.

## 3. Connect the app

In the app: **Team → Data → Shared database**. Enter the server URL
(`https://SITE_DOMAIN/api`, pre-filled in the server's own build) and the token, tick *Sync automatically*, Save, then
*Sync now*. The status line shows what the server stored and anything it rejected.
Every change is pushed a few seconds later from then on.

Several coaches can sync; a device only ever deletes rows it wrote itself.

## 4. Watch it work

```bash
# what the server holds, last batch, pipeline watermarks
curl -s -H "Authorization: Bearer $SYNC_TOKEN" http://localhost:8080/v1/summary | jq
# recent syncs with any rejected rows
curl -s -H "Authorization: Bearer $SYNC_TOKEN" http://localhost:8080/v1/batches | jq '.[0]'
# the local warehouse (PIPELINE_TARGET=local)
docker compose exec pipeline python -c "import duckdb; print(duckdb.connect('/lake/warehouse.duckdb', read_only=True).sql('SELECT * FROM marts.agg_rotation_season ORDER BY rotation'))"
```

## 5. Scoresheets (optional)

Drop the league's official results as CSV into `platform/scoresheets/` (mounted read-only
into the pipeline): `*.sets.csv` and `*.players.csv`, columns as in
`platform/fixtures/scoresheets/`. The next run ingests them and the reconciliation tables
show every difference from what the app recorded.

## 6. Dashboards on the server (optional)

```bash
docker compose --profile bi up -d       # Metabase on 127.0.0.1:3001
```

Add Postgres as a database (host `postgres`, db/user/password from `.env`) for operational
questions, and BigQuery (service-account JSON) for the marts once GCP is set up. See
[`platform/dashboards/README.md`](../../platform/dashboards/README.md).

## Backups

- Postgres: `docker compose exec postgres pg_dump -U vt vt | gzip > vt-$(date +%F).sql.gz`
  on a cron, or any Postgres backup tool you already run.
- The lake is itself a history of every change; with `PIPELINE_TARGET=gcp` it lives in
  Cloud Storage, so the server is no longer the only copy of the season.

## Upgrading

```bash
git pull
docker compose up -d --build
```

Migrations run automatically; the pipeline image is replaced in place.
