# Enterprise Operations

## Scope

This document is for deployers running LoreHub in enterprise or managed-cloud style environments.

## Recommended Topology

- Public entry: ingress or reverse proxy
- Web service: horizontally scalable
- API service: horizontally scalable
- Worker service: independently scalable
- PostgreSQL: managed or HA deployment
- Redis: managed or replicated cache/queue layer
- Lore server: private network only
- Object storage: S3-compatible backend for Lore immutable content

## Enterprise Identity Rollout

1. Configure OIDC or SAML providers in the admin enterprise auth surface.
2. Validate callback URLs and issuer metadata in a staging environment.
3. Enable LDAP sync only after team mappings are reviewed.
4. Review audit logging before turning on destructive or admin-heavy workflows.

## Operational Controls To Validate

- branch protection and approval thresholds
- CI status gates on change requests
- artifact partition storage behavior
- audit visibility for role changes and obliteration actions
- backup coverage for PostgreSQL and Lore-backed storage

## Pre-Production Checks

- ingress TLS and DNS ready
- secrets injected outside source control
- database migration path tested
- worker queue and artifact flow tested
- admin pages reviewed for SSO, LDAP, billing, and SLA visibility

## Production Cautions

- The current deployment assets are scaffolds and should be hardened before public launch.
- Lore integration seams exist, but some user-facing surfaces are still demo-backed and should not be treated as final source-of-truth workflows until backend replacement lands.
