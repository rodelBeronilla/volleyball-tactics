# ADR 0001: Hybrid topology — system of record at home, analytics in the cloud

**Status:** accepted · **Date:** 2026-10-26

## Context

The app's data lived in one browser. We want a shared platform for a coaching staff with
dashboards and notebooks, while keeping costs near zero and keeping the team's own data on
hardware the coach controls. A home server with Docker already exists; a GCP account
exists.

## Decision

- **Operational store on the server**: Postgres behind a small API. It enforces
  constraints and keeps history. Writes are low-volume and local.
- **Lake and warehouse on GCP**: Cloud Storage for immutable Parquet batches, BigQuery
  for staging and marts, Looker Studio and notebooks on top.
- **Push, never pull, across the boundary**: the server uploads batches; GCP never
  connects to the server. The server needs only outbound HTTPS and one least-privilege
  service account.
- **The pipeline is one image with two targets** so every stage can run on either side.
  The cloud job rebuilds the warehouse from the bucket even when the server is off.
- **The web app is served from Cloud Run** (and still from GitHub Pages) with the API URL
  baked in at build time.

## Alternatives considered

- *Everything on GCP (Cloud SQL + Cloud Run API)*: simpler network story, but a monthly
  bill for a database that sees a few writes a week, and the data leaves the house.
- *Everything on the server (Postgres + DuckDB + Metabase)*: works, and is exactly the
  `local` target, but makes the server a single point of failure for the staff and gives
  the analytics no path to grow (Looker Studio, bigger data, other teams).
- *Cloud pulls from the server (VPN / Cloud SQL proxy / Tailscale)*: inbound access to a
  home network, certificates and a VPN to maintain, for no benefit over a push.

## Consequences

- Two environments to operate, but each is small and documented (compose file, Terraform).
- Analytics are as fresh as the last upload plus the job schedule (minutes on the server,
  hours in the cloud by default). Acceptable for post-match analysis.
- The only long-lived secret is the server's service-account key; GitHub deploys use
  Workload Identity Federation.
