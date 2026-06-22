# Deployment quick start

For local development without containers, see
[Getting started](../getting-started.md). This page covers container/cluster
deployment.

## Docker Compose (Community Edition)

The Compose stack runs api + web + worker + postgres + redis + minio.

```bash
cp .env.example .env          # adjust secrets (set a strong LORE_JWT_SECRET)
docker compose -f infra/compose/docker-compose.yml up --build
```

- Web: <http://localhost:3000> · API: <http://localhost:8080>
- The API applies the schema migration on startup. To load sample data:
  `docker compose exec -T postgres psql -U postgres -d lorehub < scripts/seed.sql`

### Lore backend

By default the stack runs with `LORE_BACKEND=fake` (in-process), so it boots with
no external Lore server. To run a real `loreserver`:

```bash
# build/publish a loreserver image, set LORE_SERVER_IMAGE in .env, then:
LORE_BACKEND=http docker compose -f infra/compose/docker-compose.yml --profile lore up
```

> There is no public `loreserver` image yet; build one from the
> [Lore](https://github.com/EpicGames/lore) repo. Real gRPC wiring of the Lore
> read path is in progress (`PLAN.md` §30.3).

## Helm (Kubernetes)

```bash
./scripts/install.sh --mode helm --namespace lorehub --domain lorehub.example.com
```

The chart lives in `infra/helm/lorehub` and expects published images for the api,
web, and worker services. Provide Postgres/Redis/object-storage via values or
managed services. See [enterprise operations](enterprise-operations.md).

## Terraform

Reference environments live under `infra/terraform/envs/` (Fly.io, Hetzner) with a
shared `lorehub-cloud` module. Validate against your own accounts before use.

## Production checklist

- [ ] Set a strong `LORE_JWT_SECRET` and per-deployment secrets (never the dev defaults)
- [ ] Managed/persistent Postgres with backups
- [ ] TLS/ingress in front of api + web
- [ ] `LORE_BACKEND=http` with a real loreserver once gRPC wiring lands
- [ ] Do **not** load `scripts/seed.sql` — production starts empty
