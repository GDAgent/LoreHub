-- LoreHub schema (single clean baseline — pre-release, no back-compat).
-- Core: users, organizations, repositories.
-- Collaboration: membership, issues, change requests, branches, locks, notifications.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Identity & auth
-- ---------------------------------------------------------------------------

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    title TEXT,
    avatar_initials TEXT,
    password_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX sessions_user_id_idx ON sessions(user_id);

CREATE TABLE api_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    scopes TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
);
CREATE INDEX api_tokens_user_id_idx ON api_tokens(user_id);

-- ---------------------------------------------------------------------------
-- Organizations & repositories
-- ---------------------------------------------------------------------------

CREATE TABLE organizations (
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

CREATE TABLE repositories (
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
CREATE INDEX repositories_org_id_idx ON repositories(org_id);
CREATE INDEX repositories_created_at_idx ON repositories(created_at DESC);

-- ---------------------------------------------------------------------------
-- Membership
-- ---------------------------------------------------------------------------

CREATE TABLE org_members (
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'Developer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (org_id, user_id),
    CONSTRAINT org_members_role_check CHECK (role IN ('Owner', 'Maintainer', 'Developer', 'Reporter', 'Guest'))
);

CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (org_id, slug)
);

CREATE TABLE team_members (
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (team_id, user_id)
);

CREATE TABLE repo_collaborators (
    repo_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'Developer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (repo_id, user_id),
    CONSTRAINT repo_collaborators_role_check CHECK (role IN ('Owner', 'Maintainer', 'Developer', 'Reporter', 'Guest'))
);

-- ---------------------------------------------------------------------------
-- Issues
-- ---------------------------------------------------------------------------

CREATE TABLE labels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repo_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#6b7280',
    description TEXT,
    UNIQUE (repo_id, name)
);

CREATE TABLE milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repo_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    due_on DATE,
    state TEXT NOT NULL DEFAULT 'open',
    CONSTRAINT milestones_state_check CHECK (state IN ('open', 'closed'))
);

CREATE TABLE issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repo_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    number INTEGER NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    state TEXT NOT NULL DEFAULT 'open',
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    closed_at TIMESTAMPTZ,
    UNIQUE (repo_id, number),
    CONSTRAINT issues_state_check CHECK (state IN ('open', 'closed'))
);
CREATE INDEX issues_repo_state_idx ON issues(repo_id, state);

CREATE TABLE issue_labels (
    issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
    PRIMARY KEY (issue_id, label_id)
);

CREATE TABLE issue_assignees (
    issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (issue_id, user_id)
);

CREATE TABLE issue_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX issue_comments_issue_idx ON issue_comments(issue_id, created_at);

-- ---------------------------------------------------------------------------
-- Change requests
-- ---------------------------------------------------------------------------

CREATE TABLE change_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repo_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    number INTEGER NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    state TEXT NOT NULL DEFAULT 'open',
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    source_branch TEXT NOT NULL,
    target_branch TEXT NOT NULL DEFAULT 'main',
    base_revision TEXT,
    head_revision TEXT,
    merge_revision TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    merged_at TIMESTAMPTZ,
    UNIQUE (repo_id, number),
    CONSTRAINT change_requests_state_check CHECK (state IN ('draft', 'open', 'merged', 'closed'))
);
CREATE INDEX change_requests_repo_state_idx ON change_requests(repo_id, state);

CREATE TABLE cr_labels (
    cr_id UUID NOT NULL REFERENCES change_requests(id) ON DELETE CASCADE,
    label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
    PRIMARY KEY (cr_id, label_id)
);

CREATE TABLE cr_reviewers (
    cr_id UUID NOT NULL REFERENCES change_requests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (cr_id, user_id)
);

CREATE TABLE cr_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cr_id UUID NOT NULL REFERENCES change_requests(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    state TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT cr_reviews_state_check CHECK (state IN ('approved', 'commented', 'requested'))
);

CREATE TABLE cr_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cr_id UUID NOT NULL REFERENCES change_requests(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Branches & locks
-- ---------------------------------------------------------------------------

CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repo_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    head_revision TEXT NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (repo_id, name)
);

CREATE TABLE locks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repo_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    lock_type TEXT NOT NULL DEFAULT 'exclusive',
    note TEXT,
    acquired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (repo_id, path),
    CONSTRAINT locks_type_check CHECK (lock_type IN ('exclusive', 'review'))
);

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    href TEXT NOT NULL DEFAULT '#',
    read BOOLEAN NOT NULL DEFAULT false,
    email_status TEXT NOT NULL DEFAULT 'queued',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT notifications_kind_check CHECK (kind IN ('mention', 'issue', 'review', 'team', 'permission')),
    CONSTRAINT notifications_email_status_check CHECK (email_status IN ('sent', 'queued'))
);
CREATE INDEX notifications_user_idx ON notifications(user_id, created_at DESC);
