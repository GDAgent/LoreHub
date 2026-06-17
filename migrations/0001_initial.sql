CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'free',
    lore_partition BYTEA,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT organizations_plan_check CHECK (plan IN ('free', 'team', 'business', 'enterprise')),
    CONSTRAINT organizations_partition_length_check CHECK (
        lore_partition IS NULL OR octet_length(lore_partition) = 16
    )
);

CREATE TABLE IF NOT EXISTS repositories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    visibility TEXT NOT NULL DEFAULT 'private',
    lore_partition_id BYTEA NOT NULL,
    default_branch TEXT NOT NULL DEFAULT 'main',
    archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT repositories_visibility_check CHECK (visibility IN ('public', 'internal', 'private')),
    CONSTRAINT repositories_partition_length_check CHECK (octet_length(lore_partition_id) = 16),
    UNIQUE (org_id, name)
);

CREATE INDEX IF NOT EXISTS repositories_org_id_idx ON repositories(org_id);
CREATE INDEX IF NOT EXISTS repositories_created_at_idx ON repositories(created_at DESC);
