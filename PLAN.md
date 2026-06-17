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
18. [Open Questions & Risks](#18-open-questions--risks)

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

## 18. Open Questions & Risks

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
