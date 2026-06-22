# Local development

For first-run setup (Postgres, API, web, seed) see
[Getting started](../getting-started.md). This page covers the day-to-day
workflow once you're running.

## Tooling

- Rust stable toolchain
- Node.js 20+ and npm
- PostgreSQL 16+

## Code map

| Path | What |
| --- | --- |
| `apps/api` | Axum API — routes, auth (Argon2 + sessions), migrations, Lore JWT issuance, pipeline log WS |
| `apps/worker` | Background worker / CI runner |
| `apps/web` | Next.js 15 (App Router) frontend + design system (`app/globals.css`) |
| `packages/db-types` | Shared SQLx row structs |
| `packages/lore-client` | Lore transport seam: `LoreBackend` trait, `LoreClient` (real), `FakeLoreBackend` (tests) |
| `migrations/` | Single SQL schema baseline (auto-applied by the API at startup) |
| `scripts/seed.sql` | Dev-only sample data (never auto-applied) |

## Common commands

```bash
cargo build --workspace          # build everything
cargo test --workspace           # run all Rust tests
cargo clippy --workspace         # lint (keep clean)
cargo run -p api                 # run the API (applies migrations)
npm run dev:web                  # web dev server (hot reload)
npm run build:web                # web production build + typecheck
```

## Verify before committing

```bash
cargo test --workspace && cargo clippy --workspace && npm run build:web
```

## Frontend data layer

Pages fetch live data through `apps/web/lib/repo-data.ts`, which calls the typed
client in `apps/web/lib/api.ts` and **falls back to the `demo-*.ts` modules** when
the API is unreachable. The demo modules and the fallback are development
scaffolding — as each page is wired to the API, its demo source is removed (see
`PLAN.md` §30.1).

## Database changes

The schema is a single baseline migration (`migrations/0001_schema.sql`). Pre-1.0
there is **no back-compat requirement**: edit the baseline directly and recreate
your local database rather than stacking incremental migrations.

```bash
sudo -u postgres dropdb --if-exists lorehub && sudo -u postgres createdb lorehub
cargo run -p api                 # re-applies the schema
psql "$DATABASE_URL" -f scripts/seed.sql
```

## Conventions

- SQLx queries use runtime-checked `query_as`/`query` so the workspace builds
  without a live database.
- Reuse existing route/component shapes when replacing a demo-backed flow with a
  live one — don't add parallel pages.
- Keep `cargo clippy` and the web typecheck clean.
