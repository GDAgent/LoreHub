# Quick Start

## Compose

```bash
./scripts/install.sh --mode compose
```

## Helm

```bash
./scripts/install.sh --mode helm --namespace lorehub --domain lorehub.example.com
```

The Helm chart lives in `infra/helm/lorehub` and expects published images for the API, web, and worker services.
