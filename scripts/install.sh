#!/usr/bin/env bash
set -euo pipefail

MODE="compose"
NAMESPACE="lorehub"
RELEASE_NAME="lorehub"
DOMAIN="lorehub.example.com"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode)
      MODE="$2"
      shift 2
      ;;
    --namespace)
      NAMESPACE="$2"
      shift 2
      ;;
    --release-name)
      RELEASE_NAME="$2"
      shift 2
      ;;
    --domain)
      DOMAIN="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

case "$MODE" in
  compose)
    echo "Installing LoreHub via Docker Compose"
    docker compose -f "$ROOT_DIR/infra/compose/docker-compose.yml" up --build -d
    ;;
  helm)
    echo "Installing LoreHub via Helm"
    helm upgrade --install "$RELEASE_NAME" "$ROOT_DIR/infra/helm/lorehub" \
      --namespace "$NAMESPACE" \
      --create-namespace \
      --set ingress.host="$DOMAIN"
    ;;
  *)
    echo "Unsupported mode: $MODE" >&2
    exit 1
    ;;
esac

echo "LoreHub install completed in $MODE mode."
