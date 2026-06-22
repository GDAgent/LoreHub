# LoreHub — Project Plan

> **GitHub for Lore** — a collaborative development platform built natively on top of [Lore](https://github.com/EpicGames/lore), Epic Games' open-source, binary-first, content-addressed VCS. LoreHub is to Lore what GitHub is to Git, with GitLab's self-hosting model baked in from day one.

---

## Table of Contents

1. [What is Lore (VCS)?](#1-what-is-lore-vcs)
2. [What is LoreHub?](#2-what-is-lorehub)
3. [Key Differentiators](#3-key-differentiators)
4. [Architecture Overview](#4-architecture-overview)
5. [Technology Stack](#5-technology-stack)
6. [Feature Set](#6-feature-set)
7. [Lore Feature Utilization](#7-lore-feature-utilization)
8. [Monorepo Structure](#8-monorepo-structure)
9. [Deployment Model](#9-deployment-model)
10. [Free & Low-Cost Hosting](#10-free--low-cost-hosting)
11. [Paid Self-Deployment (Enterprise Edition)](#11-paid-self-deployment-enterprise-edition)
12. [Pricing Tiers](#12-pricing-tiers)
13. [Data Model](#13-data-model)
14. [API Design](#14-api-design)
15. [UI/UX Principles](#15-uiux-principles)
16. [Security Model](#16-security-model)
17. [Development Roadmap](#17-development-roadmap)
18. [Launch Checklist](#18-launch-checklist)
19. [Developer Guide](#19-developer-guide)
20. [Deployer Guide](#20-deployer-guide)
21. [Open Questions & Risks](#21-open-questions--risks)

---

## 1. What is Lore (VCS)?

Lore (`github.com/EpicGames/lore`) is a next-generation, open-source version control system by Epic Games. Key properties that shape LoreHub's design:

| Property | Description |
|---|---|
| **Centralized** | Single authoritative server; clients fetch/push from/to it |
| **Content-addressed** | BLAKE3-hashed; every byte is stored exactly once globally |
| **Binary-first** | All content is opaque byte streams; no line-oriented assumptions |
| **Chunked** | Large files split via FastCDC or fixed-size; only changed chunks re-upload |
| **Sparse/lazy** | Clients fetch only what they need; workspaces can be partial |
| **Partitioned** | Each repo is a `partition` (16-byte ID); strict multi-tenant isolation |
| **Merkle tree** | File trees are Merkle DAGs; revision hashes commit the entire tree state |
| **Immutable revisions** | Revision = frozen DAG node; branches = mutable pointers |
| **Obliteration** | Content can be removed without breaking the revision chain |
| **API-first** | C ABI + Rust / Python / JS / C# / Go SDKs |
| **Replaceable backends** | S3-compatible immutable store; any CAS-capable KV for mutable state |
| **File locking** | Native locking for binary assets (e.g. unmerge-able textures) |
| **Links** | Cross-repo references with access control at the partition boundary |
| **Layers** | Local overlays that don't pollute committed history |
| **Shared stores** | Multiple working instances share one on-disk fragment store |

Lore is pre-1.0, MIT-licensed, written in Rust, and actively used inside Epic for UEFN (Unreal Editor for Fortnite).

---

## 2. What is LoreHub?

LoreHub is a **self-hostable collaborative platform** built on top of the Lore server. It provides:

- A **web UI** for browsing repositories, revisions, branches, assets, and diffs
- **Change request** (merge/review) workflows
- **Issue tracking** and project boards
- **CI/CD** pipeline triggers hooked to Lore revisions
- **Organizations, teams, and fine-grained permissions** (mapped to Lore partitions)
- **Asset discovery** — searchable registry of game assets, textures, audio, 3D models
- **Storage analytics** — deduplication ratios, fragment counts, hot/cold tier status
- **Obliteration request UI** — GDPR-compliant content removal workflows
- **Admin panel** — server health, user management, quota enforcement

Business model mirrors GitLab:

- **Community Edition (CE)** — fully open-source, self-hosted, free forever
- **Enterprise Edition (EE)** — additional features gated by license key (SSO, advanced analytics, SLA dashboard, multi-server clustering)
- **LoreHub Cloud** — managed hosting; free tier + paid plans

---

## 3. Key Differentiators

### vs. GitHub
| GitHub | LoreHub |
|---|---|
| Git (text-optimized) | Lore (binary-first, game-scale) |
| LFS as afterthought | Chunked binary storage native |
| No file locking | Native file locking UI |
| No asset preview (native) | Asset type preview (images, audio, 3D) |
| No dedup visibility | Storage analytics per repo |
| Submodules are painful | Links/layers as first-class citizens |
| Multi-tenancy via org/user | Partition-level isolation in the storage layer |

### vs. GitLab
| GitLab | LoreHub |
|---|---|
| Git backend | Lore backend |
| Git LFS for binary | Native chunked binary |
| Self-host CE/EE model | Same model, applied to Lore |
| No game-dev asset tools | Asset browser, lock management, sparse UI |

### vs. Perforce (Helix Core + Swarm)
| Perforce | LoreHub |
|---|---|
| Proprietary protocol | Open protocol (Lore spec) |
| Proprietary server | Open-source server (Lore) |
| MD5 integrity | BLAKE3 cryptographic integrity |
| Opaque storage | Content-addressed, auditable |
| Expensive licensing | Free CE / affordable EE |

---

## 4. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         LoreHub                                  │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Web UI      │  │  API Server  │  │  Background Worker   │  │
│  │  (Next.js)   │  │  (Rust/Axum) │  │  (Rust/Tokio)        │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                 │                       │              │
│         └────────┬────────┘                       │              │
│                  │                                │              │
│         ┌────────▼────────────────────────────────▼───────────┐ │
│         │              LoreHub Database (PostgreSQL)           │ │
│         │  users, orgs, repos metadata, issues, comments,     │ │
│         │  change requests, CI pipelines, audit log           │ │
│         └───────────────────────────────────────────────────-─┘ │
│                  │                                               │
│         ┌────────▼────────────────────────────────────────────┐ │
│         │                   Lore Server                        │ │
│         │  (lore-server: Rust; manages partitions, revisions, │ │
│         │   branches, fragments, auth, wire protocol)          │ │
│         └────────┬────────────────────────────────────────────┘ │
│                  │                                               │
│        ┌─────────┴──────────┐                                   │
│        │                    │                                    │
│  ┌─────▼──────┐    ┌────────▼───────┐                           │
│  │  Immutable │    │  Mutable Store │                           │
│  │  Store     │    │  (PostgreSQL / │                           │
│  │  (S3 /     │    │   DynamoDB /   │                           │
│  │  Cloudflare│    │   etcd)        │                           │
│  │  R2 / disk)│    └────────────────┘                           │
│  └────────────┘                                                  │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Redis       │  │  Search      │  │  Email / Notifs      │  │
│  │  (sessions,  │  │  (Meilisearch│  │  (SMTP / webhook)    │  │
│  │  task queue) │  │  or Typesense│  │                      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Component Roles

| Component | Role |
|---|---|
| **Web UI (Next.js)** | Server-side rendered frontend; repo browser, diff viewer, asset preview, admin |
| **API Server (Rust/Axum)** | REST + GraphQL gateway; translates web/CI actions into Lore partition operations + DB writes |
| **Background Worker** | CI triggers, search indexing, email dispatch, storage analytics computation, obliteration execution |
| **PostgreSQL (LoreHub)** | All metadata Lore doesn't store: users, issues, comments, change requests, pipeline runs, labels |
| **Lore Server** | The Lore server binary; owns VCS data, partition auth, fragment transfer, wire protocol |
| **S3-compatible store** | Immutable fragment storage backend for Lore |
| **Mutable store** | PostgreSQL or DynamoDB for Lore's branch pointers and name mappings |
| **Redis** | Session cache, async task queue (via `bb8`/`deadpool`), hot fragment metadata cache |
| **Meilisearch** | Full-text search over repo contents, issues, users, asset metadata |

---

## 5. Technology Stack

### Backend
| Layer | Technology | Rationale |
|---|---|---|
| API server | **Rust + Axum** | Same language as Lore; can link directly against `lore-capi`; zero-cost Lore integration |
| Background worker | **Rust + Tokio** | Async-native; shares code with API server |
| Database ORM | **SQLx** (async Rust) | Compile-time query checking; no ORM magic |
| Migrations | **sqlx-migrate** | Embedded migration files |
| Auth | **JWT + OAuth2** | JWT maps directly to Lore's partition auth model |
| Lore integration | **`lore-capi` FFI** or **Lore gRPC wire** | Either embed the library or speak the wire protocol to a sidecar `lore-server` |
| Task queue | **Redis + custom scheduler** or **BullMQ (Node bridge)** | CI triggers, indexing |
| Search | **Meilisearch** | Simple self-hostable, fast, permissive license |
| Email | **Lettre** (Rust SMTP) | Transactional email |

### Frontend
| Layer | Technology | Rationale |
|---|---|---|
| Framework | **Next.js 15 (App Router)** | SSR for fast page loads; great ecosystem |
| Styling | **Tailwind CSS + shadcn/ui** | Low-level utility classes + accessible components |
| State | **Zustand + React Query** | Server state via React Query; client state via Zustand |
| Diff viewer | **monaco-editor** + custom binary diff | Code diffs in Monaco; image/audio diffs custom |
| 3D preview | **Three.js / react-three-fiber** | glTF/FBX/OBJ preview for 3D game assets |
| Image diff | **pixelmatch** | Pixel-level image comparison |
| Revision graph | **d3.js** | DAG visualization for revision history |
| TypeScript | **strict mode** | End-to-end type safety |

### Infrastructure
| Layer | Technology |
|---|---|
| Container | Docker (multi-stage Rust builds) |
| Orchestration | Docker Compose (CE) / Helm (EE/cloud) |
| Reverse proxy | Caddy (automatic TLS) or Nginx |
| Object storage | Cloudflare R2, AWS S3, MinIO (self-hosted) |
| CI for LoreHub itself | GitHub Actions (ironic but practical) |
| Monitoring | Prometheus + Grafana (bundled in docker-compose) |
| Logging | Structured JSON → Loki or stdout |

---

## 6. Feature Set

### 6.1 Repository Management

- **Repository browser** — file tree, file viewer, syntax highlighting, binary asset preview
- **Sparse checkout indicator** — show which paths are hydrated vs. stored-only
- **Revision history** — list revisions with author, timestamp, message, hash
- **Revision DAG** — interactive d3 visualization of the revision graph (branches, merges, tags)
- **Branch management** — list, create, delete, protect branches
- **Tags and releases** — tag a revision; attach release notes and downloadable archives
- **File locking dashboard** — see who has locked what file, lock/unlock from UI
- **Link management** — configure sub-repo links, pin to revision or follow branch
- **Storage analytics** — deduplication ratio, fragment count, total size, tier breakdown
- **Repository forking** — create a new partition that starts from a pinned link to the parent; copy-on-write semantics when Lore supports it
- **Repository visibility** — public / internal (org-only) / private
- **Repository archive** — mark as archived; read-only access retained

### 6.2 Code Review / Change Requests

Lore doesn't have "pull requests" — it has revisions and branches. LoreHub models review against Lore's primitives:

- **Change Request (CR)** — proposal to advance a target branch to a new revision (or to merge a source branch into target)
- **Revision diff** — side-by-side or unified diff; for binaries show size delta, chunk delta, and type-specific preview
- **Inline comments** — comment on file paths in a diff; thread resolution
- **Review assignments** — request review from specific users or teams
- **Approval workflow** — N approvals required (configurable per branch protection rule)
- **CI status integration** — CR blocked until CI passes
- **Auto-merge** — merge when CI green + approvals met
- **Conflict detection** — detect when CR's base diverges from target; show rebase instructions
- **Draft CRs** — work-in-progress; no CI trigger, no review request

### 6.3 Issue Tracking

- GitHub-style issues with labels, milestones, assignees
- Issue templates (Markdown)
- Cross-references between issues, CRs, and revisions (e.g. `Fixes #42`)
- Issue search and filtering
- Bulk actions (close, label, assign)

### 6.4 Project Boards

- Kanban boards (To Do / In Progress / Done)
- Epics (grouping of issues)
- Milestones with progress tracking

### 6.5 CI/CD

- **Pipeline triggers** — on new revision pushed to branch, on CR opened/updated, on tag created
- **Pipeline definition** — YAML config in repo (e.g. `.lorehub/pipeline.yml`)
- **Runner model** — LoreHub-managed runners (Cloud) or self-hosted runners (CE/EE); runners check out a sparse workspace using the Lore CLI
- **Artifact storage** — artifacts saved as Lore revisions in a dedicated CI partition per repo
- **Environment deployments** — staging/production deploy gates with manual approval
- **Cache** — Lore's content-addressed storage means CI cache hits are free (same hash = same fragment already stored)
- **Matrix builds** — test across platforms/configurations
- **Pipeline as code** — full YAML DSL; no UI-only configuration

### 6.6 Organizations & Teams

- **Organizations** — namespace for repos, teams, and members
- **Teams** — groups of users within an org; mapped to Lore partition ACL entries
- **Roles** — `Owner`, `Maintainer`, `Developer`, `Reporter`, `Guest` (per org and per repo)
- **Org-level branch protection** — enforce rules across all org repos
- **Audit log** — every permission change, push, obliteration request, CR merge logged

### 6.7 Asset Registry (Game-Dev Specific)

- **Asset browser** — filter repos by asset type: textures, audio, 3D models, animations, blueprints, data tables
- **Asset metadata** — embed custom metadata in Lore's immutable metadata slot (file format, dimensions, duration, poly count, etc.)
- **Asset preview** — image (PNG/TGA/EXR), audio (waveform + playback), 3D (glTF/FBX/OBJ viewer), video (WebM player)
- **Asset search** — search by tag, metadata, content hash (find duplicate assets across repos)
- **Dependency graph** — which assets reference which (via link/layer tracking)

### 6.8 Obliteration Requests

Lore supports fragment-level obliteration (content removal that preserves the revision chain). LoreHub surfaces this:

- **Obliteration request** — user submits request specifying file path + context (file ID); provides reason (accidental secret, GDPR, DMCA)
- **Approval workflow** — repo owner or org admin approves/rejects
- **Execution** — worker calls Lore's two-phase obliteration (prepare → commit)
- **Audit trail** — obliteration permanently logged; revision history shows "obliterated" marker
- **GDPR tooling** — locate all fragments associated with a user's file ID across all partitions the org controls; bulk obliterate

### 6.9 Administration

- **Server health dashboard** — Lore server uptime, partition count, fragment throughput
- **Storage quotas** — per-org and per-repo soft/hard limits on partition storage
- **User management** — invite, deactivate, transfer repo ownership
- **License management** (EE) — upload and apply license key; view feature entitlements
- **Backup and restore** — automated snapshot of PostgreSQL + Lore mutable store; docs for immutable store backup (S3 versioning)
- **Maintenance mode** — put server into read-only mode for upgrades

---

## 7. Lore Feature Utilization

This section maps every major Lore capability to a LoreHub feature to ensure none is wasted.

| Lore Feature | LoreHub Utilization |
|---|---|
| **Partition** | Each LoreHub repository → one Lore partition; org-level isolation at the storage layer |
| **Immutable store** | All repository file content; CI artifacts; release archives |
| **Mutable store** | Branch pointers synced; LoreHub reads branch list directly from Lore's mutable store |
| **BLAKE3 content addressing** | "Find duplicate assets" feature; integrity verification on download; dedup metrics |
| **FastCDC chunking** | Transparent to users; surfaced in storage analytics (chunk count, chunk reuse rate) |
| **Merkle tree revisions** | Revision graph visualization; efficient diff (only changed nodes fetched) |
| **Sparse/lazy fetch** | CI runner checks out only the paths needed by the pipeline; VFS integration |
| **File locking** | Lock dashboard; lock/unlock API; CR blocks if reviewer has lock on changed file |
| **Links** | Sub-repo links managed in UI; pin, auto-follow, commit through parent |
| **Layers** | Shown as "local overlay" in workspace UI; not committed |
| **Shared stores** | Surfaced as "shared workspace" in advanced dev settings |
| **Obliteration** | Full obliteration request workflow (see §6.8) |
| **Partition auth (JWT)** | LoreHub issues short-lived Lore-scoped JWTs for every user session |
| **Context (file ID)** | Used for move/rename tracking; obliteration scoping |
| **Replaceable backends** | LoreHub CE ships with MinIO + PostgreSQL; EE supports S3, R2, GCS, DynamoDB |
| **Metadata (immutable)** | Asset metadata (dimensions, format, poly count) stored in Lore's immutable metadata |
| **Metadata (mutable)** | Issue references, CI status tags attached to revisions via mutable metadata |
| **Compression (Zstandard)** | LoreHub shows per-repo compression ratio in storage analytics |
| **VFS** (roadmap) | VFS-aware workspace — developer checks out only what's needed; LoreHub shows VFS mount status |
| **Locking (enforced, roadmap)** | LoreHub enforces locks at CR-merge time: can't merge a CR that touches a file locked by someone else |
| **Web client (Lore roadmap)** | LoreHub is the web client Epic's roadmap mentions |

---

## 8. Monorepo Structure

```
lorehub/
├── apps/
│   ├── api/                    # Rust API server (Axum)
│   │   ├── src/
│   │   │   ├── main.rs
│   │   │   ├── auth/           # JWT issuance, OAuth2 (GitHub/Google/SAML)
│   │   │   ├── routes/         # REST endpoints
│   │   │   ├── graphql/        # GraphQL schema + resolvers
│   │   │   ├── lore/           # Lore client (wraps lore-capi or gRPC)
│   │   │   ├── db/             # SQLx queries and migrations
│   │   │   └── workers/        # Background task definitions
│   │   └── Cargo.toml
│   │
│   ├── web/                    # Next.js frontend
│   │   ├── app/                # App Router pages
│   │   │   ├── (auth)/         # Login, register, OAuth callback
│   │   │   ├── [org]/
│   │   │   │   ├── [repo]/
│   │   │   │   │   ├── tree/   # File browser
│   │   │   │   │   ├── revisions/ # Revision list + graph
│   │   │   │   │   ├── branches/
│   │   │   │   │   ├── issues/
│   │   │   │   │   ├── cr/     # Change requests
│   │   │   │   │   ├── pipelines/
│   │   │   │   │   ├── locks/
│   │   │   │   │   ├── assets/ # Asset browser
│   │   │   │   │   └── settings/
│   │   │   │   └── settings/   # Org settings
│   │   │   ├── admin/          # Server admin panel
│   │   │   └── explore/        # Public repo discovery
│   │   ├── components/
│   │   │   ├── diff/           # Code diff + binary diff components
│   │   │   ├── asset-preview/  # Image, audio, 3D, video previews
│   │   │   ├── revision-dag/   # d3 DAG visualization
│   │   │   └── ui/             # shadcn/ui components
│   │   └── package.json
│   │
│   └── worker/                 # Rust background worker
│       ├── src/
│       │   ├── main.rs
│       │   ├── ci/             # CI pipeline runner orchestration
│       │   ├── search/         # Meilisearch indexing
│       │   ├── obliterate/     # Obliteration execution
│       │   ├── analytics/      # Storage analytics computation
│       │   └── notifications/  # Email + webhook dispatch
│       └── Cargo.toml
│
├── packages/
│   ├── lore-client/            # Shared Rust library: Lore API client
│   │   └── Cargo.toml          # Used by api/ and worker/
│   └── db-types/               # Shared Rust structs for DB rows
│
├── infra/
│   ├── docker/
│   │   ├── Dockerfile.api
│   │   ├── Dockerfile.web
│   │   └── Dockerfile.worker
│   ├── compose/
│   │   ├── docker-compose.yml          # CE one-liner deployment
│   │   ├── docker-compose.override.yml # local dev overrides
│   │   └── docker-compose.ee.yml       # EE additional services
│   ├── helm/                   # Kubernetes Helm chart (EE/Cloud)
│   │   └── lorehub/
│   └── terraform/              # Cloud infra (Cloud tier)
│       ├── modules/
│       └── envs/
│
├── docs/
│   ├── architecture/
│   ├── deployment/
│   │   ├── quick-start.md      # 5-minute CE setup
│   │   ├── railway.md
│   │   ├── fly.md
│   │   ├── hetzner.md
│   │   └── kubernetes.md
│   └── api/                    # OpenAPI + GraphQL schema docs
│
├── scripts/
│   ├── install.sh              # CE one-liner installer
│   └── upgrade.sh
│
├── Cargo.toml                  # Workspace root
├── Cargo.lock
├── package.json                # Root (turborepo / pnpm workspaces)
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

---

## 9. Deployment Model

LoreHub ships as three tiers:

### Tier 1 — Community Edition (CE)

- **License**: AGPL-3.0 (web platform code) + MIT (client libraries)
- **Deployment**: Single `docker-compose.yml` with all dependencies bundled
- **Includes**: All core features (repos, CRs, issues, CI, asset browser, basic analytics)
- **Limitations**: No SSO/SAML, no advanced clustering, no SLA dashboard
- **Support**: Community (Discord + GitHub Issues)
- **Cost**: Free forever

### Tier 2 — Enterprise Edition (EE)

- **License**: Source-available (BSL-style); binary free up to N seats, paid above
- **Deployment**: Same Docker Compose + Helm chart; unlocked via license key
- **Adds**: SAML/OIDC SSO, LDAP sync, advanced audit log, multi-server clustering, priority support SLA dashboard, compliance reports
- **Cost**: Per-seat licensing (see §12)

### Tier 3 — LoreHub Cloud

- **Managed service**: LoreHub hosts and operates the infrastructure
- **Free tier**: 1 org, 5 repos, 10GB storage, 500 CI minutes/month
- **Paid tiers**: See §12
- **Deployment**: Kubernetes (Fly.io or Hetzner managed clusters initially)

---

## 10. Free & Low-Cost Hosting

For you personally, here are the concrete free/low-cost options to get LoreHub Cloud running:

### Option A: Fully Free (< $0/month)

| Service | Component | Free Tier |
|---|---|---|
| [Fly.io](https://fly.io) | API server + Worker | 3 shared-CPU VMs free |
| [Vercel](https://vercel.com) | Next.js Web UI | Hobby tier free |
| [Neon](https://neon.tech) | PostgreSQL (LoreHub DB) | 0.5 GB free forever |
| [Cloudflare R2](https://cloudflare.com/r2) | S3-compatible (Lore immutable store) | 10 GB/month free |
| [Redis Cloud](https://redis.com/try-free/) | Redis | 30 MB free |
| [Meilisearch Cloud](https://www.meilisearch.com/cloud) | Search | 10K docs free |
| **Lore Server** | Run as Fly.io VM | Included in Fly free tier |

**Caveats**: Very limited resources; fine for personal use and demos. The Lore server needs persistent disk; Fly.io volumes are $0.15/GB/month (first 3 GB free).

### Option B: Low-Cost (~$10–20/month)

| Service | Cost | Component |
|---|---|---|
| [Hetzner CX22](https://hetzner.com) | €4.5/mo | API + Worker + Lore Server (2 vCPU, 4 GB RAM) |
| [Hetzner CX22](https://hetzner.com) | €4.5/mo | Web + PostgreSQL + Redis + Meilisearch |
| [Cloudflare R2](https://cloudflare.com/r2) | $0.015/GB beyond 10GB | S3-compatible immutable store |
| [Neon](https://neon.tech) | $0/0.5GB → $19/mo | PostgreSQL |
| **Total** | **~$10–15/mo** | Comfortable small team |

This is the recommended personal setup: two small Hetzner VMs (or one CX32 at €12/mo), Cloudflare R2 for storage, Neon for the database.

### Option C: Railway.app (~$5–15/month)

Railway supports Docker Compose deployments with environment-variable injection. LoreHub CE docker-compose maps directly. Railway's $5 developer plan covers the basics; usage-based beyond that.

```yaml
# railway.json (example)
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": { "builder": "DOCKERFILE", "dockerfilePath": "infra/docker/Dockerfile.api" },
  "deploy": { "numReplicas": 1, "restartPolicyType": "ON_FAILURE" }
}
```

### Option D: Render.com (~$7/month)

- Web Service (Docker) for API: $7/month (512 MB RAM)
- Static Site for Web UI: Free
- PostgreSQL: $7/month (1 GB) or Neon free tier
- Redis: $10/month or Upstash free tier

---

## 11. Paid Self-Deployment (Enterprise Edition)

Mirroring GitLab's model exactly:

### One-Liner Install (like GitLab Omnibus)

```bash
# Install LoreHub CE (all-in-one)
curl -fsSL https://install.lorehub.io/ce | bash

# Install LoreHub EE (requires license key)
LOREHUB_LICENSE_KEY=your-key curl -fsSL https://install.lorehub.io/ee | bash
```

This script:
1. Detects OS (Ubuntu/Debian/RHEL/macOS)
2. Installs Docker if not present
3. Pulls `lorehub/lorehub:latest` and associated containers
4. Runs interactive setup wizard (domain, SMTP, storage backend, license key)
5. Configures Caddy for automatic TLS
6. Starts all services as systemd units (Linux) or launchd (macOS)

### Docker Compose (Manual)

```bash
git clone https://github.com/lorehub/lorehub.git
cd lorehub
cp infra/compose/.env.example .env
# Edit .env: domain, S3 credentials, SMTP, license key
docker compose -f infra/compose/docker-compose.yml up -d
```

### Kubernetes / Helm

```bash
helm repo add lorehub https://charts.lorehub.io
helm install lorehub lorehub/lorehub \
  --namespace lorehub --create-namespace \
  --set global.domain=git.yourcompany.com \
  --set lore.storage.backend=s3 \
  --set lore.storage.bucket=your-bucket \
  --set license.key=your-ee-key
```

### EE Features (License-Gated)

| Feature | CE | EE |
|---|---|---|
| Core repos, CRs, issues, CI | ✅ | ✅ |
| Asset browser + obliteration | ✅ | ✅ |
| SSO (SAML 2.0 / OIDC) | ❌ | ✅ |
| LDAP / Active Directory sync | ❌ | ✅ |
| Advanced audit log (export, SIEM) | ❌ | ✅ |
| Multi-server clustering | ❌ | ✅ |
| Geo-replication | ❌ | ✅ |
| SLA dashboard | ❌ | ✅ |
| Compliance reports (SOC 2, GDPR) | ❌ | ✅ |
| Priority support (8h SLA) | ❌ | ✅ |
| Custom branding | ❌ | ✅ |
| IP allowlisting | ❌ | ✅ |

---

## 12. Pricing Tiers

### Self-Hosted

| Tier | Price | Seats | Features |
|---|---|---|---|
| **CE** | Free | Unlimited | All CE features |
| **EE Starter** | $10/seat/mo | Up to 25 | EE features |
| **EE Pro** | $20/seat/mo | Unlimited | EE features + dedicated support channel |
| **EE Enterprise** | Custom | Unlimited | Air-gap install, custom SLA, professional services |

### Cloud

| Plan | Price | Storage | CI Minutes | Repos | Seats |
|---|---|---|---|---|---|
| **Free** | $0 | 10 GB | 500/mo | 5 | 5 |
| **Team** | $15/seat/mo | 100 GB + $0.10/GB | 3,000/mo | Unlimited | Unlimited |
| **Business** | $30/seat/mo | 1 TB + $0.05/GB | 10,000/mo | Unlimited | Unlimited |
| **Enterprise** | Custom | Custom | Custom | Unlimited | Unlimited |

Storage pricing reflects Lore's deduplication advantage: teams with similar assets (common engine builds, shared texture libraries) see dramatically lower storage costs than Git LFS.

---

## 13. Data Model

### PostgreSQL Schema (LoreHub metadata layer)

```sql
-- Users
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username    TEXT UNIQUE NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    avatar_url  TEXT,
    bio         TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Organizations
CREATE TABLE organizations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT UNIQUE NOT NULL,   -- org slug
    display_name    TEXT NOT NULL,
    plan            TEXT NOT NULL DEFAULT 'free',  -- free, team, business, enterprise
    lore_partition  BYTEA(16),              -- org-level Lore partition (for shared assets)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Repositories
CREATE TABLE repositories (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              UUID REFERENCES organizations(id),
    name                TEXT NOT NULL,       -- repo slug
    display_name        TEXT NOT NULL,
    description         TEXT,
    visibility          TEXT NOT NULL DEFAULT 'private',  -- public, internal, private
    lore_partition_id   BYTEA NOT NULL,      -- the actual Lore partition ID (16 bytes)
    default_branch      TEXT NOT NULL DEFAULT 'main',
    archived            BOOLEAN NOT NULL DEFAULT false,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (org_id, name)
);

-- Issues
CREATE TABLE issues (
    id          BIGSERIAL PRIMARY KEY,
    repo_id     UUID REFERENCES repositories(id),
    number      INT NOT NULL,              -- per-repo number
    title       TEXT NOT NULL,
    body        TEXT,
    state       TEXT NOT NULL DEFAULT 'open',  -- open, closed
    author_id   UUID REFERENCES users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    closed_at   TIMESTAMPTZ,
    UNIQUE (repo_id, number)
);

-- Change Requests
CREATE TABLE change_requests (
    id              BIGSERIAL PRIMARY KEY,
    repo_id         UUID REFERENCES repositories(id),
    number          INT NOT NULL,
    title           TEXT NOT NULL,
    body            TEXT,
    state           TEXT NOT NULL DEFAULT 'open',  -- open, merged, closed, draft
    source_branch   TEXT NOT NULL,
    target_branch   TEXT NOT NULL,
    head_revision   BYTEA(32),    -- BLAKE3 hash of source branch HEAD at CR open time
    base_revision   BYTEA(32),    -- BLAKE3 hash of target branch at CR open time
    merged_revision BYTEA(32),    -- BLAKE3 hash of resulting revision after merge
    author_id       UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    merged_at       TIMESTAMPTZ,
    closed_at       TIMESTAMPTZ,
    UNIQUE (repo_id, number)
);

-- CI Pipeline runs
CREATE TABLE pipeline_runs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repo_id         UUID REFERENCES repositories(id),
    revision_hash   BYTEA(32) NOT NULL,   -- Lore revision that triggered this run
    branch          TEXT,
    cr_id           BIGINT REFERENCES change_requests(id),
    status          TEXT NOT NULL DEFAULT 'pending',  -- pending, running, success, failed, cancelled
    triggered_by_id UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at     TIMESTAMPTZ
);

-- Obliteration requests
CREATE TABLE obliteration_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repo_id         UUID REFERENCES repositories(id),
    file_path       TEXT NOT NULL,
    context_id      BYTEA(16) NOT NULL,   -- Lore file context (obliteration scope)
    reason          TEXT NOT NULL,        -- GDPR, accidental_secret, DMCA, other
    reason_detail   TEXT,
    state           TEXT NOT NULL DEFAULT 'pending',  -- pending, approved, rejected, executed
    requested_by_id UUID REFERENCES users(id),
    approved_by_id  UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    executed_at     TIMESTAMPTZ
);

-- Audit log (append-only)
CREATE TABLE audit_log (
    id          BIGSERIAL PRIMARY KEY,
    actor_id    UUID REFERENCES users(id),
    org_id      UUID REFERENCES organizations(id),
    repo_id     UUID REFERENCES repositories(id),
    action      TEXT NOT NULL,         -- push, merge_cr, obliterate, change_role, etc.
    metadata    JSONB,
    ip_address  INET,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
) PARTITION BY RANGE (created_at);
```

Lore itself stores revisions, branches, fragment data, and trees. LoreHub never replicates VCS data into PostgreSQL; it only stores metadata about it.

---

## 14. API Design

### REST API (`/api/v1/`)

```
GET    /api/v1/repos/{org}/{repo}/revisions           # List revisions
GET    /api/v1/repos/{org}/{repo}/revisions/{hash}    # Get revision
GET    /api/v1/repos/{org}/{repo}/tree/{hash}/{path}  # Browse file tree at revision
GET    /api/v1/repos/{org}/{repo}/blob/{hash}/{path}  # Fetch file content
GET    /api/v1/repos/{org}/{repo}/diff/{base}/{head}  # Diff two revisions
GET    /api/v1/repos/{org}/{repo}/branches            # List branches
POST   /api/v1/repos/{org}/{repo}/branches            # Create branch
GET    /api/v1/repos/{org}/{repo}/locks               # List locked files
POST   /api/v1/repos/{org}/{repo}/locks               # Acquire lock
DELETE /api/v1/repos/{org}/{repo}/locks/{path}        # Release lock
GET    /api/v1/repos/{org}/{repo}/links               # List sub-repo links
POST   /api/v1/repos/{org}/{repo}/issues              # Create issue
GET    /api/v1/repos/{org}/{repo}/cr                  # List change requests
POST   /api/v1/repos/{org}/{repo}/cr                  # Open change request
POST   /api/v1/repos/{org}/{repo}/cr/{number}/merge   # Merge CR
POST   /api/v1/repos/{org}/{repo}/obliterate          # Submit obliteration request
GET    /api/v1/repos/{org}/{repo}/analytics           # Storage analytics
```

### GraphQL (`/api/graphql`)

GraphQL for complex queries (nested repo + issue + CR + pipeline data in one request); REST for simple CRUD and file operations.

### Lore Wire Integration

The API server speaks directly to the Lore server using:
- **Embedded library**: `lore-capi` linked directly into the API server binary (lowest latency; ideal for CE single-host deploy)
- **gRPC sidecar**: API server → gRPC → `lore-server` process (ideal for EE multi-server deploy; same wire protocol Lore uses)

The LoreHub API server mints short-lived (15-minute) Lore JWTs scoped to the partition(s) the authenticated user has access to. These JWTs are passed through to the Lore server for all VCS operations.

---

## 15. UI/UX Principles

### Inspired by GitHub
- Clean, minimal chrome; content is the focus
- Repository page with `Code | Issues | Change Requests | Pipelines | Settings` tabs
- Inline inline comment threads on diffs
- Markdown rendering everywhere
- @mention, #issue cross-references

### Inspired by GitLab
- Left-side navigation for repo sections (not top tabs for deep pages)
- Pipeline visualization (DAG of jobs)
- Built-in CI config editor with validation
- Admin area for server management
- Comprehensive audit log

### Lore-Specific UX

- **Binary asset diff**: side-by-side image comparison with zoom + pixel delta; waveform diff for audio; 3D mesh overlay for models
- **Revision graph**: interactive d3 DAG (not a linear list); hover to see revision hash/message; click to expand details
- **Sparse workspace indicator**: file tree shows `[hydrated]` / `[available]` / `[locked]` badges
- **Storage analytics widget**: on every repo homepage — "X GB stored, Y% dedup savings, Z chunks shared with other repos"
- **Lock manager**: dedicated UI showing all locked files, who holds the lock, since when, with a "request unlock" button
- **Obliteration UI**: clearly marked as destructive; two-phase (request → approval → execute); permanent audit trail shown

---

## 16. Security Model

### Authentication
- **Username/password** + bcrypt (CE baseline)
- **OAuth2** (GitHub, Google, GitLab) — social login
- **SAML 2.0** (EE) — enterprise SSO
- **OIDC** (EE) — Okta, Azure AD, Keycloak
- **API tokens** — scoped (read, write, admin) with expiry

### Authorization
- LoreHub checks permissions in PostgreSQL
- For VCS operations, LoreHub mints a Lore JWT scoped to the partition with the minimum required permission (`read` or `write` or `admin`)
- The Lore server enforces partition-level isolation; LoreHub cannot grant cross-partition access

### Data Isolation
- Lore's partition model means repo A's bytes are physically inaccessible to repo B's session, even in a shared mutable/immutable store
- LoreHub adds a second layer (PostgreSQL ACL check) before touching Lore
- Public repos: LoreHub issues unauthenticated read-only Lore JWTs

### Secrets
- No secrets in LoreHub DB or logs
- Obliteration workflow for accidentally committed secrets
- Future: secrets scanning on push (worker pipeline)

### Network
- All inter-service communication over mTLS (CE: same host so loopback; EE: Caddy/Nginx mutual TLS between services)
- Lore server and PostgreSQL never exposed on public network; only the API server and web UI are public-facing

---

## 17. Development Roadmap

### Phase 0 — Foundation (Weeks 1–4)

- [x] Cargo workspace scaffold (`api`, `worker`, `lore-client`, `db-types`)
- [x] PostgreSQL schema and SQLx migration system
- [x] Lore server integration layer (`lore-client` crate wrapping `lore-capi` or gRPC)
- [x] JWT issuance for Lore partition access
- [x] Repository CRUD (create → provision Lore partition → register in DB)
- [x] Basic web UI shell (Next.js, routing, auth pages)
- [x] Docker Compose CE stack (api + web + lore-server + postgres + redis + minio)

### Phase 1 — Core VCS UI (Weeks 5–10)

- [x] File browser (tree view at any revision)
- [x] File viewer (syntax highlight for code; binary detection)
- [x] Revision list and revision detail
- [x] Branch list and branch creation
- [x] Basic diff viewer (text; unified + side-by-side)
- [x] Revision DAG (d3 visualization)
- [x] Push via Lore CLI (LoreHub provides server URL + JWT; user uses Lore CLI)

### Phase 2 — Collaboration (Weeks 11–18)

- [x] Issues (create, comment, label, close, search)
- [x] Change Requests (open, review, inline comments, approve, merge)
- [x] @mentions and cross-references
- [x] Notifications (in-app + email)
- [x] Organizations and teams
- [x] Role-based permissions

### Phase 3 — Game-Dev Features (Weeks 19–26)

- [x] Binary asset preview (image, audio, 3D model, video)
- [x] Binary diff (image pixel diff, size delta, chunk delta)
- [x] File locking dashboard
- [x] Storage analytics
- [x] Obliteration request workflow
- [x] Asset metadata display

### Phase 4 — CI/CD (Weeks 27–34)

- [x] Pipeline YAML config (`.lorehub/pipeline.yml`)
- [x] Self-hosted runner agent (Rust binary using Lore CLI for workspace checkout)
- [x] Pipeline run log streaming (WebSocket)
- [x] Artifact storage via Lore partitions
- [x] CI status gates on Change Requests

### Phase 5 — Enterprise & Cloud (Weeks 35–50)

- [x] SAML/OIDC SSO (EE)
- [x] LDAP sync (EE)
- [x] Advanced audit log (EE)
- [x] Helm chart
- [x] One-liner installer script
- [x] LoreHub Cloud infrastructure (Fly.io / Hetzner)
- [x] Cloud billing integration
- [x] SLA dashboard (EE)
- [x] Mobile-responsive UI

### Phase 6 — Polish & Ecosystem (Ongoing)

- [ ] Lore VS Code extension integration (link CRs to editor)
- [ ] Webhooks (outbound HTTP triggers on push, CR events, CI completion)
- [ ] Marketplace / integrations registry
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Localization

---

## 18. Launch Checklist

This section is the practical go/no-go list for moving LoreHub from repository scaffold to a public alpha or first customer deployment.

### 18.1 Product Readiness

- [ ] Replace demo-backed repository, collaboration, asset, and CI views with persisted API-backed flows where launch-critical
- [ ] Complete direct Lore execution for branch, revision, asset, lock, and obliteration operations
- [ ] Validate all enterprise auth and LDAP flows against at least one real provider in staging
- [ ] Confirm every destructive flow has clear UI affordances and audit coverage
- [ ] Review copy and terminology for Lore-native concepts such as revisions, partitions, and change requests

### 18.2 Backend Readiness

- [ ] Pin and document the exact Lore server version used for launch
- [ ] Finalize repository, issue, change request, and pipeline persistence models in PostgreSQL
- [ ] Harden worker job retry, timeout, and idempotency behavior
- [ ] Add production observability for API latency, worker throughput, error rates, and pipeline execution
- [ ] Validate artifact partition lifecycle and retention behavior

### 18.3 Deployment Readiness

- [ ] Validate Compose path for CE and Helm path for EE/Cloud
- [ ] Verify secrets injection, TLS, ingress, and private-network boundaries
- [ ] Test backups and restore for PostgreSQL plus Lore storage
- [ ] Validate Terraform environment shapes for Fly.io and Hetzner against real accounts
- [ ] Produce staging-to-production rollout steps and rollback instructions

### 18.4 Security Readiness

- [ ] Review JWT issuance and partition scoping rules
- [ ] Confirm no secrets are committed to repo, demo data, or deployment assets
- [ ] Validate audit visibility for role, policy, and identity changes
- [ ] Test obliteration approval and execution controls
- [ ] Document incident response and credential rotation procedure

### 18.5 Launch Readiness

- [ ] Prepare first-run documentation for developers and deployers
- [ ] Prepare alpha onboarding flow for target studios or teams
- [ ] Define support channel, issue triage path, and bug severity rubric
- [ ] Confirm pricing, plan limits, and billing events for managed hosting
- [ ] Run a full staging rehearsal using launch-like data and operational steps

---

## 19. Developer Guide

This section documents how contributors should reason about the repository in its current state.

### 19.1 Current Codebase Shape

- `apps/api` owns the first real backend seams: config loading, migration startup, JWT issuance, repository CRUD, and pipeline log streaming
- `apps/worker` owns background execution shape including the CI runner demo path and artifact flow scaffolding
- `apps/web` currently mixes real route structure with demo-backed data modules to stabilize UX and information architecture before every backend flow is finalized
- `packages/lore-client` is the key abstraction layer that must absorb future Lore transport changes

### 19.2 Development Principles

- Preserve route and component shape when replacing demo-backed logic with real API-backed flows
- Prefer extending shared seams rather than creating separate temporary implementations
- Treat completed phases as stable structure unless there is a strong reason to refactor them
- Keep Lore-specific terminology consistent across code, docs, and UI copy

### 19.3 Expected Local Workflow

1. Run `cargo test --workspace`
2. Run `npm install` if dependencies changed
3. Run `npm run build:web`
4. Use Compose for integrated smoke validation when deployment-related work changes

### 19.4 Replacement Priorities

The highest-value developer work after the current scaffold is:

1. Real Lore transport and repository execution
2. Persisted collaboration state and role enforcement
3. Real pipeline execution and artifact storage
4. Production-grade deployment hardening
5. Accessibility, localization, and integration work

### 19.5 Documentation References

- `README.md` for top-level orientation
- `docs/development/local-dev.md` for local workflow
- `docs/deployment/*.md` for deployment-specific notes

---

## 20. Deployer Guide

This section is for operators choosing between CE, EE, and managed-cloud style paths.

### 20.1 Deployment Options

- **Compose**: fastest path for CE and local evaluation
- **Helm**: intended path for EE and clustered environments
- **Terraform + platform-specific rollout**: intended path for first managed cloud footprints on Fly.io or Hetzner

### 20.2 Current Asset Maturity

- `infra/compose/docker-compose.yml` is the best local integration path today
- `infra/helm/lorehub` is a deployment scaffold that needs image, secret, persistence, and ingress hardening before production use
- `infra/terraform` defines environment shapes and module boundaries, not full production infrastructure yet
- `scripts/install.sh` provides a consistent entry point for Compose or Helm installs

### 20.3 Minimum Operational Expectations

- Lore server and PostgreSQL stay private
- web and API are the only public-facing services
- PostgreSQL backups are automated and restore-tested
- object storage lifecycle and cost model are reviewed
- SSO, LDAP, audit log, and billing controls are tested in staging before customer rollout

### 20.4 Recommended Rollout Sequence

1. Validate the application locally with Compose
2. Stand up a staging environment with Helm or platform-specific infrastructure
3. Connect real identity, storage, and database services
4. Run end-to-end CI, collaboration, and admin-control rehearsals
5. Execute the launch checklist before exposing the instance publicly

### 20.5 Documentation References

- `docs/deployment/quick-start.md`
- `docs/deployment/fly.md`
- `docs/deployment/hetzner.md`
- `docs/deployment/enterprise-operations.md`

---

## 21. Open Questions & Risks

| Risk | Mitigation |
|---|---|
| **Lore is pre-1.0; APIs will change** | Pin to specific Lore releases; abstract behind `lore-client` crate interface; track Lore's LEPs |
| **Lore server has no hosted instance yet** | LoreHub CE bundles a Lore server binary in Docker Compose; no dependency on external Lore hosting |
| **Binary diff UX is hard** | Start with size/chunk-count delta; add image pixel diff; defer 3D model diff |
| **Lore CLI is the only client today** | LoreHub web UI for browsing/reviewing is independent of the CLI; users still push via CLI; future: web-based upload for small files |
| **S3 egress costs at scale** | Cloudflare R2 (zero egress) is the recommended default; document cost implications for AWS S3 |
| **AGPL vs MIT licensing choice** | LoreHub web platform: AGPL-3.0 (forces open-source forks, protects against cloud providers); client libraries and CLI tools: MIT |
| **Rust frontend for team velocity** | Keep Rust for backend; use Next.js (JS) for frontend to maximize available contributor pool |
| **Lore's merge UX is different from Git** | Educate users: "Change Request" not "Pull Request"; rebase semantics differ; documentation and UI copy must be clear |
| **Cold-start: no users yet** | Target game studios and UE developers first (natural overlap with Epic/UEFN ecosystem); Discord community to build before launch |

---

## Appendix A: Key External Resources

- **Lore VCS**: https://github.com/EpicGames/lore
- **Lore website**: https://lore.org
- **Lore Discord**: https://discord.gg/E4SFJKRPbg
- **Lore Python SDK**: https://github.com/EpicGames/lore-python
- **Lore JS SDK**: https://github.com/EpicGames/lore-js
- **Lore Go SDK**: https://github.com/EpicGames/lore-go
- **Lore C# SDK**: https://github.com/EpicGames/lore-dotnet
- **Cloudflare R2**: https://cloudflare.com/r2 (free 10GB egress-free S3-compatible storage)
- **Fly.io**: https://fly.io (free tier VMs)
- **Neon**: https://neon.tech (free serverless PostgreSQL)
- **Hetzner**: https://hetzner.com (cheapest reliable VPS)
- **GitLab CE** (architectural inspiration): https://gitlab.com/gitlab-org/gitlab

## Appendix B: Lore ADRs Relevant to LoreHub Design

| ADR | Implication for LoreHub |
|---|---|
| 00001 — FastCDC | Analytics UI should show chunk boundary algorithm per file type |
| 00005 — Web framework | Lore server uses Axum; LoreHub API can share the same Rust web ecosystem |
| 00009 — JS bindings | LoreHub can use `lore-js` for in-browser operations (auth, small uploads) |
| 00010 — Fragment max size | Large file upload in web UI must chunk at ≤fragment max size |
| 00011 — CLI frontend | LoreHub web UI supplements but doesn't replace the Lore CLI |
| 00016 — Compression (Zstandard) | LoreHub storage analytics shows compressed vs uncompressed sizes |

---

# Part II — Production Readiness Plan (Reality Assessment & Remediation Roadmap)

> **Status of this document.** Part I (sections 1–21) is the *original aspirational plan*. The Phase 1–5 checkboxes in §17 mark **structure that exists**, not features that are production-ready. This Part II is the honest, working remediation plan: what is actually built today, what is missing, and the concrete improvements to make it a real GitHub/GitLab-class product. Where Part II and Part I disagree, **Part II wins.**

## 22. Honest Current-State Assessment (as of this audit)

### 22.1 What actually exists

| Area | Reality | Verdict |
|---|---|---|
| **Frontend** | ~5,000 LOC across 46 files; Next.js 15 App Router; full route skeleton present (repo, tree, issues, CR, pipelines, assets, admin, auth, enterprise) | Route IA is good; everything else is a shell |
| **Frontend data** | Nearly every page renders **static demo data** from `apps/web/lib/demo-*.ts`. No real fetching, no mutations, no persistence | Prototype, not product |
| **Styling** | Hand-rolled **1,000-line `globals.css`** using dark glassmorphism (gradients, blur, rounded "panel" cards). **No Tailwind, no shadcn/ui** despite §5 claiming them. No design tokens beyond a few CSS vars, no component library, no light mode | Looks like a generic landing page, not a dev platform; primary source of "ugly" |
| **Backend (API)** | ~760 LOC of Rust total. `health`, partial repository routes, a stub `auth.rs` JWT issuer, stub `pipelines.rs`, `error.rs`, `config.rs` | Skeleton only |
| **Lore integration** | `packages/lore-client` is ~87 LOC and does **not** speak to a real Lore server (no FFI, no gRPC) | Not implemented |
| **Database** | One baseline migration; SQLx wiring partial; most tables from §13 not exercised by code | Not real |
| **Worker** | `main.rs` + `runner.rs` (~110 LOC); CI runner is a demo path; no real queue, no streaming-from-real-jobs | Scaffold |
| **Auth/sessions** | No real login, no session store, no password hashing in use, no OAuth, SSO/LDAP are demo UI only | Not real |
| **CI/CD** | YAML schema and a UI; no real runner executing real pipelines against real revisions | Not real |
| **Infra** | Compose/Helm/Terraform/`install.sh` are scaffolds with TODO-level maturity | Not deploy-ready |
| **Docs** | README + a few `docs/` stubs; deployment/ops/release docs incomplete | Incomplete |
| **Tests** | Minimal Rust tests; no frontend tests, no e2e, no CI quality gates | Missing |

### 22.2 Implication

"Phases 1–5 complete" is true only as *navigational scaffolding*. To become a credible competitor the project needs: (1) a real design system and rebuilt UI, (2) a real backend with real persistence/auth, (3) real Lore + CI execution, (4) Phase 6, (5) complete docs + hardened deploy. This is a **multi-session program**, sequenced below.

---

## 23. Workstream A — UI/UX Overhaul (highest visible priority)

Goal: stop looking like a prototype; match the polish and information density of GitHub/GitLab.

### 23.1 Design system foundation
- [~] Adopt **Tailwind CSS v4 + shadcn/ui** (as §5 always intended) and retire the bespoke `globals.css` incrementally. *(Done differently: rebuilt `globals.css` as a full semantic-token design system keyed to the shared class vocabulary so all 46 pages lifted at once without a per-page migration. Tailwind/shadcn remains an optional later step — the token layer is what they would have provided.)*
- [x] Define **design tokens**: color scales (neutral/brand/success/warning/danger/info), spacing, radius, typography scale, elevation/shadows, focus rings, z-index layers.
- [x] **Light + dark themes** with `prefers-color-scheme` + manual toggle persisted per user (no-FOUC init script in `layout.tsx`, toggle in the header). Default is a clean, high-contrast light theme.
- [x] Typography: system/`Inter` UI font + a real **monospace** stack for code, hashes, diffs, branch names.
- [~] Iconography: inline SVG icon set in the header/palette (lucide-react not added to avoid a new dependency; can swap later).

### 23.2 Core component library (shadcn-based, app-specific wrappers)
- [ ] Primitives: Button (variants/sizes/loading), Input, Textarea, Select, Combobox, Checkbox, Radio, Switch, Tooltip, Dropdown menu, Dialog/Modal, Sheet/Drawer, Tabs, Toast, Popover, Avatar, Badge/Label chip, Skeleton loaders, Spinner, Pagination, Breadcrumbs, EmptyState, Banner/Callout.
- [ ] App composites: **AppShell** (top bar + contextual left nav), repo header with tab bar, file/code blocks with line numbers + copy, Markdown renderer (GFM, task lists, mentions, issue refs, code highlighting), comment/thread component, label/state pills, **CommitHash/RevisionHash** with copy, **CodeOwners/Avatar stacks**, key-value metadata lists, data tables with sort/filter.
- [ ] Loading/empty/error states for **every** list and detail view (no blank screens).

### 23.3 Global navigation & IA
- [x] Real **global top bar**: brand, global search trigger, notifications bell, user avatar menu with dropdown. *(Create (+) menu still TODO.)*
- [x] **Command palette** (⌘K) for jump-to repo/issue/CR, actions, and navigation (`components/command-palette.tsx`).
- [x] Reusable repo **tab bar** with active state (`components/repo-tabs.tsx`); top tabs on repo pages. *(Contextual left nav on deep pages still TODO.)*
- [ ] Consistent breadcrumbs: `org / repo / section / item`.
- [ ] Real user/org/repo switching.

### 23.4 Page-by-page rebuild (visual + interaction)
- [x] **Marketing/home** (logged-out): credible product landing (hero, push snippet, feature grid, comparison) — replaced "Phase 0 scaffold" copy.
- [ ] **Dashboard** (logged-in): activity feed, your repos, assigned issues/CRs.
- [ ] **Explore**: searchable/filterable repo discovery cards.
- [x] **Repo home**: README render, About sidebar (visibility, storage-savings widget, branches/revisions), file list, clone/push entry. *(Branch/revision picker + languages bar still TODO.)*
- [ ] **Code tree + file viewer**: breadcrumb path, syntax highlight, blame-style metadata, binary/asset preview routing, raw/download, copy-permalink.
- [ ] **Revisions list + revision detail**: rich rows, **revision DAG** redesigned (legible, zoom/pan, hover cards).
- [x] **Diff viewer**: GitHub-style file cards with per-file +/- diff stats, totals header, unified default + collapsible side-by-side. *(Changed-file tree nav + inline comment affordance still TODO.)*
- [x] **Issues list + detail**: filter bar (open/closed counts), colored labels, state icons, clean rows, collapsible new-issue form; detail is two-column (conversation + assignees/labels/milestone sidebar). *(Bulk actions still TODO.)*
- [x] **Change Requests list + detail**: filter bar (open/draft/merged), review timeline, **merge box** with pipeline + approval gates, reviewers/labels/linked-issues/revisions sidebar, inline threads, draft state. *(Conflict/diverged banners still TODO.)*
- [x] **Pipelines list + run detail**: status rows with job pills, run detail with job status timeline, live log streaming UI, artifacts table, runner/sparse/partition sidebar. *(Stage DAG + re-run/cancel still TODO.)*
- [x] **Assets browser + detail + binary diff**: responsive grid, type-filter pills, previews, dedup ("% chunks shared") on each card; asset detail with preview, metadata, chunk-profile bar, and action sidebar; binary-diff page with stat cards, per-type visual diff, and type-specific delta table. *(Cross-repo "find duplicates" still TODO.)*
- [x] **Branches** (list rows, default/new badges, new-branch form, new-CR action) and **Revisions** (commit rows with diff stats + sticky revision-graph sidebar) rebuilt with the repo tab bar.
- [x] **Locks, Obliteration, Analytics**: locks list with lock/unlock affordances + empty state; obliteration requests with status pills and a destructive new-request flow; storage analytics with stat cards, tier-breakdown bars, store composition, and per-asset chunk table. *(All rebuilt on the repo tab bar.)*
- [ ] **Settings** (repo/org/user): tabbed forms with validation, danger zones.
- [ ] **Admin + Enterprise** (auth/SSO, directory/LDAP, audit, SLA, cloud billing): real dashboard layouts.
- [ ] **Auth pages**: polished login/register/SSO with validation and error states.

### 23.5 Quality bars
- [ ] Fully **responsive** (mobile → ultrawide) with sensible breakpoints.
- [ ] **Accessibility**: keyboard nav, focus management, ARIA, color-contrast AA, reduced-motion.
- [ ] Consistent **toasts/optimistic UI** for mutations once backend is wired.
- [ ] Performance: code-split heavy viewers (Monaco/3D), lazy-load previews.

---

## 24. Workstream B — Backend & Data (make it real)

### 24.1 Persistence
- [ ] Finalize the full PostgreSQL schema from §13 + additions: sessions, api_tokens, oauth_identities, org_members, teams, team_members, repo_collaborators, roles/permissions, labels, milestones, issue/cr comments, reactions, reviews/approvals, notifications, webhooks, pipeline jobs/logs/artifacts, storage_stats, releases/tags.
- [ ] Real **SQLx** queries (compile-time checked) for every entity; migrations runnable from a clean DB.
- [ ] Seed/fixtures for local dev that mirror the current demo data so the UI keeps working during migration.

### 24.2 API surface
- [ ] Implement the REST endpoints in §14 for real (repos, tree, blob, diff, branches, locks, links, issues, CRs, obliterate, analytics) + auth, orgs/teams/members, notifications, webhooks, search, pipelines.
- [ ] Consistent error envelope, pagination, filtering, rate limiting, request IDs.
- [ ] OpenAPI spec generated/maintained; typed client for the frontend.

### 24.3 Auth & authz
- [ ] Real **username/password** (argon2/bcrypt), session cookies + CSRF, **API tokens** (scoped, expiring).
- [ ] **OAuth2** (GitHub/Google/GitLab) social login.
- [ ] Role-based authorization enforced server-side (Owner/Maintainer/Developer/Reporter/Guest) at org and repo scope.
- [ ] Short-lived **Lore-scoped JWT** minting per §16 once Lore transport exists.

### 24.4 Lore integration (`packages/lore-client`)
- [ ] Define the transport seam (gRPC wire and/or `lore-capi` FFI) behind a stable trait.
- [ ] Implement: partition provisioning, list/read revisions, browse tree, fetch blob, branch list/create, diff, locks, links, obliteration two-phase, metadata read/write.
- [ ] Pin and document the exact Lore server version; integration tests against a real `lore-server` in Compose.
- [ ] Until a real Lore server is available, ship a **conformance-tested fake** implementing the same trait so the rest of the stack is real.

### 24.5 Worker & CI
- [ ] Real task queue (Redis-backed) with retry/timeout/idempotency.
- [ ] **Real CI runner**: pick up pipeline runs, check out sparse workspace via Lore, execute YAML stages/jobs, stream logs over WebSocket, store artifacts as Lore revisions, report status back to CRs.
- [ ] Search indexing (Meilisearch), email/webhook dispatch, storage-analytics computation, obliteration execution.

### 24.6 Frontend ↔ backend wiring
- [ ] Introduce **React Query** (+ a small typed API client); replace `demo-*` modules page-by-page with live data while preserving route/component shape (per §19.2).
- [ ] Mutations with optimistic UI + toasts; auth-gated routes; real session state.

---

## 25. Workstream C — Phase 6 (Polish & Ecosystem)

- [ ] **Webhooks**: outbound HTTP on push/CR/CI events; delivery log + retry; signing secret; management UI.
- [ ] **Integrations/marketplace** registry (initial: status checks, chat notifications).
- [ ] **VS Code / editor** linkage (open CR/file in editor; deep links).
- [ ] **Accessibility audit** to WCAG 2.1 AA (formalize 23.5).
- [ ] **Localization** scaffolding (i18n framework, externalized strings, at least en + one locale).

---

## 26. Workstream D — Documentation (release-grade)

- [ ] **README** rewrite: accurate status, screenshots, quick-start, architecture diagram, links.
- [ ] **Developer docs**: local setup (Compose), running api/web/worker, migrations, test commands, code map, contribution guide, coding standards.
- [ ] **Deployment docs**: quick-start (CE), self-host hardening, Compose reference, Helm, Terraform (Fly.io, Hetzner), Railway/Render, TLS/ingress/secrets, backup & restore, upgrade & rollback.
- [ ] **Operations runbooks**: monitoring, on-call/incident response, credential rotation, maintenance mode, scaling.
- [ ] **Admin/Enterprise docs**: SSO/SAML/OIDC setup, LDAP sync, audit export, license management, SLA dashboard.
- [ ] **API docs**: OpenAPI reference + GraphQL schema + auth/token guide + webhooks.
- [ ] **User guide**: repos, change requests, issues, pipelines, assets, locks, obliteration; Lore CLI push workflow.
- [ ] **Pricing/plans + billing** docs for Cloud; license/edition matrix (CE/EE/Cloud).
- [ ] **Security docs**: threat model summary, responsible disclosure, data isolation, GDPR/obliteration.

---

## 27. Workstream E — Infra, Deploy & Release Hardening

- [ ] Real multi-stage **Dockerfiles** (api/web/worker) that build from clean checkout.
- [ ] **Compose** CE stack that boots end-to-end (api+web+worker+postgres+redis+minio+lore-server+caddy) with `.env.example`.
- [ ] **Helm** chart: images, secrets, persistence, ingress, resources, probes.
- [ ] **Terraform**: working Fly.io and Hetzner environments validated against real accounts.
- [ ] **`install.sh`/`upgrade.sh`**: idempotent, OS-detecting, interactive setup wizard.
- [ ] **CI for LoreHub itself** (GitHub Actions): build, test, lint, typecheck, image publish, preview deploy.
- [ ] **Observability**: structured logs, Prometheus metrics, Grafana dashboards, healthchecks.
- [ ] Backups + restore tested for Postgres and Lore mutable store; object-storage lifecycle documented.

---

## 28. Workstream F — Quality, Security & Testing

- [ ] **Rust**: unit + integration tests; `clippy` clean; `cargo test --workspace` gate.
- [ ] **Frontend**: typecheck strict, component tests (Vitest/RTL), **Playwright e2e** for core flows.
- [ ] **Security**: review JWT/partition scoping, secret handling (none in repo/logs), authz enforcement, obliteration controls, IP allowlisting (EE), dependency audit.
- [ ] **Accessibility** automated checks (axe) in CI.
- [ ] Performance budgets for key pages (Core Web Vitals).

---

## 29. Recommended Execution Sequence

This is the order that maximizes felt progress while de-risking the hard parts:

1. **A1–A3 (design system + shell + nav)** — establish the look/feel foundation everything else inherits.
2. **A4 high-traffic pages** — home/dashboard, repo home, code tree+file, issues, CRs, pipelines (visual rebuild on a fake-but-shaped data layer).
3. **B1–B3 (schema, API, auth)** — stand up real persistence + auth.
4. **B6 wiring** — replace demo modules with live data on the rebuilt pages, page-by-page.
5. **B4–B5 (Lore client + worker/CI)** — real VCS + pipeline execution (or conformance-tested fake until a Lore server is pinned).
6. **C (Phase 6)** — webhooks, integrations, a11y audit, i18n.
7. **D + E + F** — docs, deploy hardening, tests/security run in parallel and gate the launch checklist (§18).

### 29.1 Status legend for Part II
`[ ]` not started · `[~]` in progress · `[x]` done & verified. These boxes — not §17's — are the source of truth for production readiness going forward.
