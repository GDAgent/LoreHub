# Local Development

## Goals

This repository currently balances two modes of work:

- shipping real shared infrastructure seams in Rust and deployment assets
- using demo-backed UI data to lock down product structure before every backend flow is fully persisted and Lore-driven

That means local development should validate both code correctness and product-shape consistency.

## Tooling

- Rust stable toolchain
- Node.js 22+
- `npm`
- Docker for Compose validation

## Core Commands

```bash
cargo test --workspace
npm install
npm run build:web
docker compose -f infra/compose/docker-compose.yml up --build
```

## Where To Work

- `apps/api` — API routes, migrations, auth, WebSocket streaming
- `apps/worker` — background jobs and CI runner behavior
- `apps/web` — user-facing and admin-facing product shell
- `packages/lore-client` — Lore transport seam and artifact/storage abstractions
- `infra` — deployment assets

## Current Architectural Pattern

- Web product flows often read from `apps/web/lib/demo-*.ts` datasets.
- Rust services expose the first real execution seams and should remain the primary place for backend truth.
- If you replace a demo-backed web flow with a real API-backed flow, prefer reusing the same route and component structure instead of adding parallel pages.

## Expected Verification Before Commit

- `cargo test --workspace`
- `npm run build:web`
- any targeted script validation for touched deployment assets

## Practical Guidance

- Keep feature additions phase-aligned unless you are explicitly tightening earlier scaffolds.
- Prefer extending shared data helpers and route shapes over adding duplicate demo modules.
- When a feature is still demo-backed, be explicit in naming and comments so later backend replacement is straightforward.
