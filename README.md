# LoreHub

> GitHub for [Lore](https://github.com/EpicGames/lore) — a collaborative development platform built natively on top of Epic Games' open-source, binary-first version control system.

LoreHub is to Lore what GitHub is to Git, with GitLab's self-hosting model baked in from day one. Designed for game studios and teams that combine code with large binary assets.

## Status

🚧 **Pre-1.0, under active development.** The full stack runs end-to-end:
PostgreSQL → Axum API → Next.js web, with a real `loreserver` integration seam.

**Real today** (DB-backed, verified end-to-end):

- Argon2 password auth with sessions (register / login / logout / `me`)
- Issues — list, detail, create — served from PostgreSQL
- Read APIs for change requests, branches, locks, labels
- Repository CRUD + partition-scoped Lore JWT minting
- A clean single-baseline schema, applied automatically on API startup
- `LoreBackend` trait with a conformance-tested fake and a real-server seam

**Still in progress** — most UI pages still read demo modules and are being wired
to the API page by page; the real gRPC Lore read path, the Redis worker/CI, and
the broader API surface are landing next. The exact punch list is in
[`PLAN.md`](./PLAN.md) **§30 (Production Readiness Gap Audit)**.

👉 **New here? Start with [Getting started](./docs/getting-started.md)** — a
verified, end-to-end local setup.

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

- [`docs/getting-started.md`](./docs/getting-started.md) — **end-to-end local setup (start here)**
- [`docs/user-guide.md`](./docs/user-guide.md) — using LoreHub (repos, issues, CRs, locks, push)
- [`docs/reference/api.md`](./docs/reference/api.md) — HTTP API reference
- [`docs/development/local-dev.md`](./docs/development/local-dev.md) — dev workflow, code map, conventions
- [`docs/deployment/quick-start.md`](./docs/deployment/quick-start.md) — Compose / Helm / Terraform
- [`docs/deployment/fly.md`](./docs/deployment/fly.md) · [`docs/deployment/hetzner.md`](./docs/deployment/hetzner.md) · [`docs/deployment/enterprise-operations.md`](./docs/deployment/enterprise-operations.md)
- [`PLAN.md`](./PLAN.md) — architecture, roadmap, launch checklist, and the **§30 production gap audit**

## For Developers

### Tooling

- Rust stable toolchain with `cargo`
- Node.js 20+ and `npm`
- PostgreSQL 16+ (local dev); Docker for the Compose path; Helm for Kubernetes

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

- Web pages fetch live data via `apps/web/lib/repo-data.ts`, falling back to
  `demo-*.ts` modules when the API is unreachable. The demo modules and fallback
  are dev scaffolding, removed page-by-page as flows are wired (`PLAN.md` §30.1).
- The API owns migration startup, Argon2 auth + sessions, JWT minting, repository
  CRUD, the issue/CR/branch/lock read APIs, and pipeline log WebSocket streaming.
- Prefer tightening existing route/component seams over adding parallel scaffolds.

## Getting Started

See **[docs/getting-started.md](./docs/getting-started.md)** for the verified,
end-to-end local setup (Postgres → API → web). For containers and clusters see
the [deployment quick start](./docs/deployment/quick-start.md):

```bash
cp .env.example .env
docker compose -f infra/compose/docker-compose.yml up --build
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
