-- DEV-ONLY sample data. NOT a migration — never auto-applied. Run manually
-- against a development database to populate example content:
--   psql "$DATABASE_URL" -f scripts/seed.sql
-- Idempotent: safe to run repeatedly. Do not run against production.

-- Users -----------------------------------------------------------------
INSERT INTO users (id, email, username, display_name, title, avatar_initials) VALUES
    ('11111111-1111-1111-1111-111111111111', 'rin@studio.dev',  'rin',  'Rin Tanaka',    'Tech Art Lead',     'RT'),
    ('22222222-2222-2222-2222-222222222222', 'maya@studio.dev', 'maya', 'Maya Okonkwo',  'Gameplay Engineer', 'MO'),
    ('33333333-3333-3333-3333-333333333333', 'omar@studio.dev', 'omar', 'Omar Haddad',   'Audio Director',    'OH'),
    ('44444444-4444-4444-4444-444444444444', 'iris@studio.dev', 'iris', 'Iris Bennett',  'Environment Artist','IB')
ON CONFLICT (id) DO NOTHING;

-- Organization ----------------------------------------------------------
INSERT INTO organizations (id, name, display_name, plan) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'acme', 'Acme Interactive', 'business')
ON CONFLICT (id) DO NOTHING;

INSERT INTO org_members (org_id, user_id, role) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Maintainer'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'Developer'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'Owner'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', 'Developer')
ON CONFLICT (org_id, user_id) DO NOTHING;

-- Repository ------------------------------------------------------------
INSERT INTO repositories (id, org_id, name, display_name, description, visibility, lore_partition_id, default_branch) VALUES
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'demo', 'Arena Vertical Slice',
     'Reference arena vertical slice — textures, audio, models, and cinematics under binary-first history.',
     'private', '\xdddddddddddddddddddddddddddddddd', 'main')
ON CONFLICT (id) DO NOTHING;

INSERT INTO branches (repo_id, name, head_revision, is_default) VALUES
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'main', 'f34ab29ce810', true),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'feature/arena-lighting', 'b52fd9aa8c3e', false),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'audio/ambience-pass', '7c91ae447bc2', false)
ON CONFLICT (repo_id, name) DO NOTHING;

-- Labels ----------------------------------------------------------------
INSERT INTO labels (id, repo_id, name, color, description) VALUES
    ('1ab00001-0000-0000-0000-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'bug',          '#cf222e', 'Something is broken'),
    ('1ab00001-0000-0000-0000-000000000002', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'asset',        '#8250df', 'Binary asset work'),
    ('1ab00001-0000-0000-0000-000000000003', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'audio',        '#1f883d', 'Audio pipeline'),
    ('1ab00001-0000-0000-0000-000000000004', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'enhancement',  '#0969da', 'New capability')
ON CONFLICT (repo_id, name) DO NOTHING;

-- Issues ----------------------------------------------------------------
INSERT INTO issues (id, repo_id, number, title, body, state, author_id, created_at) VALUES
    ('15500001-0000-0000-0000-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 1,
     'Hero corridor texture shows compression seams',
     'The albedo for the hero corridor shows visible seams on the metallic trim after the latest export.',
     'open', '44444444-4444-4444-4444-444444444444', now() - interval '5 days'),
    ('15500001-0000-0000-0000-000000000002', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 2,
     'Arena ambience loop has an audible click at the seam',
     'The ambience loop pops at the loop boundary. Needs a crossfade or tail trim.',
     'open', '33333333-3333-3333-3333-333333333333', now() - interval '3 days'),
    ('15500001-0000-0000-0000-000000000003', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 3,
     'Statue mesh LOD popping at mid distance',
     'LOD1 to LOD2 transition on the hero statue is too aggressive.',
     'closed', '11111111-1111-1111-1111-111111111111', now() - interval '8 days')
ON CONFLICT (repo_id, number) DO NOTHING;

INSERT INTO issue_labels (issue_id, label_id) VALUES
    ('15500001-0000-0000-0000-000000000001', '1ab00001-0000-0000-0000-000000000001'),
    ('15500001-0000-0000-0000-000000000001', '1ab00001-0000-0000-0000-000000000002'),
    ('15500001-0000-0000-0000-000000000002', '1ab00001-0000-0000-0000-000000000003'),
    ('15500001-0000-0000-0000-000000000003', '1ab00001-0000-0000-0000-000000000002')
ON CONFLICT DO NOTHING;

INSERT INTO issue_assignees (issue_id, user_id) VALUES
    ('15500001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111'),
    ('15500001-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333')
ON CONFLICT DO NOTHING;

INSERT INTO issue_comments (issue_id, author_id, body) VALUES
    ('15500001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
     'Confirmed — the specular mask needs cleanup on the trim edges. Picking this up.')
ON CONFLICT DO NOTHING;

-- Change requests -------------------------------------------------------
INSERT INTO change_requests (id, repo_id, number, title, body, state, author_id, source_branch, target_branch, base_revision, head_revision, merge_revision, created_at, merged_at) VALUES
    ('c8000001-0000-0000-0000-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 1,
     'Tighten hero corridor specular mask',
     'Cleans up the emissive seams and reduces visible compression on the trim edges. Fixes #1 — please check the bottom trim seam in `Content/Materials/M_HeroCorridor.uasset`.',
     'open', '44444444-4444-4444-4444-444444444444', 'feature/arena-lighting', 'main', 'b52fd9aa8c3e', 'f34ab29ce810', NULL, now() - interval '2 days', NULL),
    ('c8000001-0000-0000-0000-000000000002', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 2,
     'Crossfade the arena ambience loop',
     'Adds a 120ms equal-power crossfade at the loop boundary to remove the audible click. Closes #2.',
     'merged', '33333333-3333-3333-3333-333333333333', 'feature/ambience-crossfade', 'main', 'a18cc0d2f5e1', 'b52fd9aa8c3e', 'c93de7710aa4', now() - interval '6 days', now() - interval '4 days')
ON CONFLICT (repo_id, number) DO NOTHING;

INSERT INTO cr_reviewers (cr_id, user_id) VALUES
    ('c8000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111'),
    ('c8000001-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111')
ON CONFLICT DO NOTHING;

INSERT INTO cr_labels (cr_id, label_id) VALUES
    ('c8000001-0000-0000-0000-000000000001', '1ab00001-0000-0000-0000-000000000002'),
    ('c8000001-0000-0000-0000-000000000001', '1ab00001-0000-0000-0000-000000000004'),
    ('c8000001-0000-0000-0000-000000000002', '1ab00001-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;

INSERT INTO cr_linked_issues (cr_id, issue_id) VALUES
    ('c8000001-0000-0000-0000-000000000001', '15500001-0000-0000-0000-000000000001'),
    ('c8000001-0000-0000-0000-000000000002', '15500001-0000-0000-0000-000000000002')
ON CONFLICT DO NOTHING;

INSERT INTO cr_reviews (cr_id, reviewer_id, state, body) VALUES
    ('c8000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'requested', 'Looks close — can you check the bottom trim seam?'),
    ('c8000001-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'approved', 'Loop is seamless now. Approved.')
ON CONFLICT DO NOTHING;

INSERT INTO cr_comments (cr_id, author_id, body, file_path, line, resolved) VALUES
    ('c8000001-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333',
     'Nice — the seam is much less visible. One more pass on the lower trim and this is good to merge.', NULL, NULL, false),
    ('c8000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
     'The specular value here still reads a little hot under the emissive pass.', 'Content/Materials/M_HeroCorridor.uasset', 42, false),
    ('c8000001-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444',
     'Dropped it by 0.05 — should sit right now.', 'Content/Materials/M_HeroCorridor.uasset', 42, false)
ON CONFLICT DO NOTHING;

-- Locks -----------------------------------------------------------------
INSERT INTO locks (repo_id, path, owner_id, lock_type, note) VALUES
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Content/Textures/T_HeroCorridor_Albedo.png', '44444444-4444-4444-4444-444444444444', 'exclusive', 'Preventing accidental overwrite during final material export.'),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Content/Cinematics/VS_Capture_01.webm', '33333333-3333-3333-3333-333333333333', 'review', 'Locked while editorial timing notes are being collected.')
ON CONFLICT (repo_id, path) DO NOTHING;

-- Notifications ---------------------------------------------------------
INSERT INTO notifications (user_id, kind, title, body, href, read, email_status) VALUES
    ('11111111-1111-1111-1111-111111111111', 'review', 'Review requested on CR #1', 'Iris requested your review on "Tighten hero corridor specular mask".', '/acme/demo/cr/1', false, 'sent'),
    ('11111111-1111-1111-1111-111111111111', 'issue', 'You were assigned issue #1', 'Hero corridor texture shows compression seams.', '/acme/demo/issues/1', false, 'sent'),
    ('11111111-1111-1111-1111-111111111111', 'mention', 'Omar mentioned you', 'Mentioned you in the arena ambience loop discussion.', '/acme/demo/issues/2', true, 'sent')
ON CONFLICT DO NOTHING;
