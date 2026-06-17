# LoreHub

> GitHub for [Lore](https://github.com/EpicGames/lore) — a collaborative development platform built natively on top of Epic Games' open-source, binary-first version control system.

LoreHub is to Lore what GitHub is to Git, with GitLab's self-hosting model baked in from day one. Designed for game studios and teams that combine code with large binary assets.

## Status

🚧 **Planning phase.** See [`PLAN.md`](./PLAN.md) for the full architecture, feature set, deployment model, and roadmap.

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
