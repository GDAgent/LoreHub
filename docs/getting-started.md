# Getting Started (end-to-end, local)

This is the fastest path from a fresh clone to a running LoreHub with a real
database and live data. Every command here is verified against the current code.

## Prerequisites

- **Rust** (stable) — `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- **Node.js 20+** and npm
- **PostgreSQL 16+** running locally (or via Docker)

No Docker is required for local development — only Postgres.

## 1. Start PostgreSQL

Native (Debian/Ubuntu):

```bash
sudo apt-get install -y postgresql
sudo systemctl start postgresql
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres'" -c "CREATE DATABASE lorehub"
```

…or with Docker:

```bash
docker run -d --name lorehub-pg -p 5432:5432 \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=lorehub \
  postgres:17-alpine
```

## 2. Configure

```bash
cp .env.example .env
```

The defaults match the Postgres above. Key variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `postgres://postgres:postgres@localhost:5432/lorehub` | API database |
| `LORE_BACKEND` | `http` | `http` (real loreserver over gRPC; default) or `fake` (in-process, dev/tests only) |
| `LORE_SERVER_URL` | `http://127.0.0.1:41337` | loreserver gRPC address when `LORE_BACKEND=http` |
| `LORE_JWT_SECRET` | dev value | **Change in any non-local environment** |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8080` | API base the web app calls |

## 3. Run the API

```bash
export $(grep -v '^#' .env | xargs)   # or use a tool like direnv
cargo run -p api
```

On first start the API **auto-applies the schema migration** (`migrations/0001_schema.sql`).
You should see `api listening address=0.0.0.0:8080`. Verify:

```bash
curl localhost:8080/health        # {"status":"ok"}
```

## 4. (Optional) Load sample data

The schema starts empty. To populate example content for development:

```bash
psql "$DATABASE_URL" -f scripts/seed.sql
curl localhost:8080/api/v1/orgs/acme/repos/demo/issues   # 3 issues
```

> `scripts/seed.sql` is **dev-only** and never auto-applied — production
> databases start empty.

## 5. Run the web app

```bash
npm install
npm run dev:web      # http://localhost:3000
```

Open <http://localhost:3000/acme/demo/issues> — issues render from the live API
(pages show a small `live`/`demo` indicator depending on whether the API answered).

## 6. (Optional) A real Lore server

Pages that need Lore data (tree/revisions/diff) use the in-process fake by
default. To run a real one, build it from the [Lore](https://github.com/EpicGames/lore)
checkout and point LoreHub at it:

```bash
# in the lore repo
cargo build -p lore-server
./target/debug/loreserver          # gRPC+QUIC :41337, HTTP :41339

# lorehub defaults to LORE_BACKEND=http / LORE_SERVER_URL=http://127.0.0.1:41337,
# so the API talks to a local loreserver out of the box. Set LORE_BACKEND=fake
# for offline dev (in-process backend, no server).
```

> The gRPC read path (provision + branches/revisions/tree/blob) is implemented;
> see `PLAN.md` §30.3. Verify it with `cargo test -p lore-client --test live_grpc
> -- --ignored` while a loreserver is running.

## Next steps

- [Local development workflow](development/local-dev.md) — tests, code map, conventions
- [API reference](reference/api.md)
- [Deployment quick start](deployment/quick-start.md)
- [User guide](user-guide.md)
