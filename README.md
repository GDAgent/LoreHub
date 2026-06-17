# LoreHub

> GitHub for [Lore](https://github.com/EpicGames/lore) — a collaborative development platform built natively on top of Epic Games' open-source, binary-first version control system.

LoreHub is to Lore what GitHub is to Git, with GitLab's self-hosting model baked in from day one. Designed for game studios and teams that combine code with large binary assets.

## Status

🚧 **Implementation scaffold with Phases 0-5 completed in-repo.**

The repository now includes:

- Rust workspace scaffolding for API, worker, shared DB types, and Lore integration seams
- A Next.js application shell covering repository browsing, collaboration, game-dev, CI/CD, and enterprise/cloud admin surfaces
- SQLx migrations and baseline repository CRUD flows
- Community Edition Docker Compose deployment wiring
- Enterprise and cloud deployment scaffolds including Helm, installer automation, and Terraform environment shapes

Important: many product surfaces are currently implemented as structured demo-backed shells. The UI, route layout, deployment paths, and integration seams are in place, but several features still need production-grade persistence and direct Lore-backed execution. See [`PLAN.md`](./PLAN.md) for the architecture, roadmap, launch checklist, and rollout details.

## Current Coverage

Implemented in-repo today:

- **Phase 0** foundation: workspace, migrations, API shell, worker shell, Compose stack
- **Phase 1** VCS UI: tree browsing, revisions, branches, diff viewer, DAG, CLI push instructions
- **Phase 2** collaboration: issues, change requests, notifications, teams, permissions
- **Phase 3** game-dev features: asset browser, binary diff shells, locks, analytics, obliteration flows
- **Phase 4** CI/CD: pipeline-as-code page flow, runner demo, artifact partition seams, WebSocket log streaming, CR gates
- **Phase 5** enterprise/cloud: SSO pages, LDAP sync, audit log, Helm, installer, Terraform scaffolds, billing, SLA, responsive shell

Still open:

- production Lore transport and branch/revision execution
- persistent collaboration and CI state beyond the demo-backed UI layer
- Phase 6 polish, integrations, localization, and accessibility hardening

## Repo Layout

- `apps/api` — Axum API with repository CRUD and Lore JWT issuance
- `apps/worker` — background worker process scaffold
- `apps/web` — Next.js app router shell with auth and repository routes
- `packages/lore-client` — Lore integration seam for partition provisioning
- `packages/db-types` — shared Rust models for database-backed types
- `migrations` — SQLx/PostgreSQL schema baseline
- `infra/compose/docker-compose.yml` — CE deployment stack
- `infra/helm/lorehub` — Helm chart scaffold for EE/Cloud deployment
- `infra/terraform` — cloud environment shapes for Fly.io and Hetzner
- `scripts/install.sh` — one-line installer entry point for Compose or Helm
- `docs/development` — contributor-oriented development workflow notes
- `docs/deployment` — deployment-oriented docs and quick start material

## Documentation Map

- [`PLAN.md`](./PLAN.md) — architecture, roadmap, launch checklist, and execution details
- [`docs/development/local-dev.md`](./docs/development/local-dev.md) — local contributor workflow
- [`docs/deployment/quick-start.md`](./docs/deployment/quick-start.md) — fastest local/self-hosted paths
- [`docs/deployment/fly.md`](./docs/deployment/fly.md) — Fly.io deployment notes
- [`docs/deployment/hetzner.md`](./docs/deployment/hetzner.md) — Hetzner deployment notes
- [`docs/deployment/enterprise-operations.md`](./docs/deployment/enterprise-operations.md) — enterprise deployment and rollout notes

## For Developers

### Tooling

- Rust stable toolchain with `cargo`
- Node.js 22+ and `npm`
- Docker for the Compose path
- Helm for Kubernetes-oriented deployment testing

### Local Verification

```bash
cargo test --workspace
npm install
npm run build:web
```

### Local App Paths

- API shell: `apps/api`
- Worker shell and runner demo: `apps/worker`
- Web application: `apps/web`
- Lore integration seam: `packages/lore-client`

### Development Notes

- The web app intentionally uses demo-backed data modules for many end-user workflows until direct Lore and DB-backed execution is wired end-to-end.
- The API already owns migration startup, JWT minting, repository CRUD, and pipeline log WebSocket streaming.
- The worker already includes a CI runner demo path to exercise sparse-checkout and artifact-partition flow shape.
- If you are extending a completed phase, prefer tightening existing seams rather than adding parallel scaffolds.

## Getting Started

### Community Edition Compose

```bash
cargo test --workspace
npm install
npm run build:web
docker compose -f infra/compose/docker-compose.yml up --build
```

Set `LORE_SERVER_IMAGE` if you need to point Compose at a specific published Lore server image.

### Installer

```bash
./scripts/install.sh --mode compose
./scripts/install.sh --mode helm --namespace lorehub --domain lorehub.example.com
```

### Helm

```bash
helm upgrade --install lorehub ./infra/helm/lorehub \
  --namespace lorehub \
  --create-namespace \
  --set ingress.host=lorehub.example.com
```

## For Deployers

### Deployment Paths

- **Compose** for CE/local validation
- **Helm** for EE or clustered/cloud-style rollouts
- **Terraform env shapes** for Fly.io or Hetzner provisioning

### Operational Expectations

- Keep Lore server and PostgreSQL off the public network
- Terminate public traffic at a reverse proxy or ingress layer
- Treat the current Helm and Terraform assets as validated deployment scaffolds, not final production modules
- Use the launch checklist in [`PLAN.md`](./PLAN.md) before any public or customer-facing rollout

### Recommended Rollout Order

1. Local Compose validation
2. Single-environment Helm deployment
3. External storage and managed database integration
4. Enterprise identity configuration
5. Monitoring, backups, and launch-readiness sign-off

## Overview

- **Web UI** — repository browser, binary asset preview, revision DAG, diff viewer
- **Change Requests** — code review workflow built on Lore's revision + branch model
- **Issues & Projects** — issue tracker, kanban boards, milestones
- **CI/CD** — pipeline triggers on Lore revisions; sparse workspace checkout
- **Asset Registry** — searchable game asset browser with image/audio/3D preview
- **File Locking** — native lock management UI for unmergeable binary assets
- **Storage Analytics** — deduplication ratios, fragment counts, tier breakdown
- **Obliteration Requests** — GDPR/DMCA content removal workflow
- **Organizations & Teams** — partition-level multi-tenancy mapped to Lore's auth model

## Deployment

| Tier | Cost |
|---|---|
| Community Edition (CE) — self-hosted | Free |
| Enterprise Edition (EE) — self-hosted | $10–20/seat/month |
| LoreHub Cloud — free tier | $0 |
| LoreHub Cloud — paid | $15–30/seat/month |

**Cheapest personal setup:** Hetzner CX22 (~€9/mo) + Cloudflare R2 (free 10 GB) + Neon PostgreSQL (free tier) ≈ **$10/month total**.

## Tech Stack

- **API**: Rust + Axum (links directly against `lore-capi`)
- **Frontend**: Next.js 15 + Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL (SQLx) for metadata; Lore owns all VCS data
- **Search**: Meilisearch
- **Storage**: Cloudflare R2 / AWS S3 / MinIO (Lore's immutable store backend)
- **Deploy**: Docker Compose (CE) · Helm (EE/Cloud)

## Links

- [Lore VCS](https://github.com/EpicGames/lore) — the underlying VCS
- [lore.org](https://lore.org) — Lore website and docs
- [Lore Discord](https://discord.gg/E4SFJKRPbg)

## License

AGPL-3.0 (platform) · MIT (client libraries)
