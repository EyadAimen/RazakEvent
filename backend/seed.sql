-- ============================================================
-- RazakEvent — Seed Data
-- Run AFTER the backend has started once so TypeORM creates
-- all tables via synchronize: true.
--
-- All IDs are INT auto-increment — never specified in INSERTs.
-- Subsequent inserts reference earlier rows by name/email subquery.
--
-- Creates:
--   3 venues | 1 club (Tech Club) | 1 lead user (Sarah)
--   3 proposals | 2 events
-- ============================================================

-- ── 1. Venues ────────────────────────────────────────────────
INSERT INTO venues (name, location)
SELECT 'Dewan Tun Hussein Onn, KTR', 'Block A, Kolej Tun Razak'
WHERE NOT EXISTS (SELECT 1 FROM venues WHERE name = 'Dewan Tun Hussein Onn, KTR');

INSERT INTO venues (name, location)
SELECT 'Computer Lab 1, KTR', 'Block B, Kolej Tun Razak'
WHERE NOT EXISTS (SELECT 1 FROM venues WHERE name = 'Computer Lab 1, KTR');

INSERT INTO venues (name, location)
SELECT 'Seminar Room A, KTR', 'Block C, Kolej Tun Razak'
WHERE NOT EXISTS (SELECT 1 FROM venues WHERE name = 'Seminar Room A, KTR');

-- ── 2. Club ──────────────────────────────────────────────────
-- description is NOT NULL; lead_id linked after user is created
INSERT INTO clubs (name, type, description, lead_id, created_at)
SELECT 'Tech Club', 'club', 'Technology and innovation club for KTR students.', NULL, NOW()
WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'Tech Club');

-- ── 3. Lead User (Sarah) ─────────────────────────────────────
-- Columns: full_name, staff_or_matric_id, password_hash, profile_photo_url
-- Password hash = bcrypt("Password123!", 10)
INSERT INTO users (full_name, staff_or_matric_id, email, password_hash, role, created_at)
SELECT
    'Sarah Amirah',
    'A22CS0001',
    'sarah.lead@graduate.utm.my',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lN86',
    'lead',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'sarah.lead@graduate.utm.my');

-- ── 4. Link club → lead ───────────────────────────────────────
UPDATE clubs
SET lead_id = (SELECT id FROM users WHERE email = 'sarah.lead@graduate.utm.my')
WHERE name = 'Tech Club';

-- ── 5. Proposals ─────────────────────────────────────────────

-- Proposal 1: Tech Symposium 2026 — approved
INSERT INTO event_proposals (
    lead_id, club_id, venue_id,
    event_name, proposed_date, description, estimated_budget,
    status, submitted_at, reviewed_at, created_at
)
SELECT
    (SELECT id FROM users WHERE email = 'sarah.lead@graduate.utm.my'),
    (SELECT id FROM clubs WHERE name = 'Tech Club'),
    (SELECT id FROM venues WHERE name = 'Dewan Tun Hussein Onn, KTR'),
    'Tech Symposium 2026',
    '2026-05-15 09:00:00',
    'Annual technology symposium bringing together students and industry professionals.',
    5000.00,
    'approved',
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '25 days',
    NOW() - INTERVAL '30 days'
WHERE NOT EXISTS (SELECT 1 FROM event_proposals WHERE event_name = 'Tech Symposium 2026');

-- Proposal 2: Hackathon Kickoff — pending admin review
INSERT INTO event_proposals (
    lead_id, club_id, venue_id,
    event_name, proposed_date, description, estimated_budget,
    status, submitted_at, created_at
)
SELECT
    (SELECT id FROM users WHERE email = 'sarah.lead@graduate.utm.my'),
    (SELECT id FROM clubs WHERE name = 'Tech Club'),
    (SELECT id FROM venues WHERE name = 'Computer Lab 1, KTR'),
    'Hackathon Kickoff',
    '2026-05-20 08:00:00',
    '24-hour hackathon open to all KTR students.',
    2000.00,
    'pending',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days'
WHERE NOT EXISTS (SELECT 1 FROM event_proposals WHERE event_name = 'Hackathon Kickoff');

-- Proposal 3: AI Workshop — approved (event will be report_due)
INSERT INTO event_proposals (
    lead_id, club_id, venue_id,
    event_name, proposed_date, description, estimated_budget,
    status, submitted_at, reviewed_at, created_at
)
SELECT
    (SELECT id FROM users WHERE email = 'sarah.lead@graduate.utm.my'),
    (SELECT id FROM clubs WHERE name = 'Tech Club'),
    (SELECT id FROM venues WHERE name = 'Seminar Room A, KTR'),
    'AI Workshop',
    '2026-04-10 09:00:00',
    'Hands-on workshop covering machine learning fundamentals.',
    1500.00,
    'approved',
    NOW() - INTERVAL '50 days',
    NOW() - INTERVAL '45 days',
    NOW() - INTERVAL '50 days'
WHERE NOT EXISTS (SELECT 1 FROM event_proposals WHERE event_name = 'AI Workshop');

-- ── 6. Events (approved proposals only) ──────────────────────
-- proposal_id, club_id, venue_id are all NOT NULL INT

-- Event 1: Tech Symposium (approved)
INSERT INTO events (proposal_id, club_id, venue_id, name, description, event_date, status, created_at)
SELECT
    (SELECT id FROM event_proposals WHERE event_name = 'Tech Symposium 2026'),
    (SELECT id FROM clubs WHERE name = 'Tech Club'),
    (SELECT id FROM venues WHERE name = 'Dewan Tun Hussein Onn, KTR'),
    'Tech Symposium 2026',
    'Annual technology symposium bringing together students and industry professionals.',
    '2026-05-15 09:00:00',
    'approved',
    NOW() - INTERVAL '25 days'
WHERE NOT EXISTS (SELECT 1 FROM events WHERE name = 'Tech Symposium 2026');

-- Event 2: AI Workshop (report_due)
INSERT INTO events (proposal_id, club_id, venue_id, name, description, event_date, status, created_at)
SELECT
    (SELECT id FROM event_proposals WHERE event_name = 'AI Workshop'),
    (SELECT id FROM clubs WHERE name = 'Tech Club'),
    (SELECT id FROM venues WHERE name = 'Seminar Room A, KTR'),
    'AI Workshop',
    'Hands-on workshop covering machine learning fundamentals.',
    '2026-04-10 09:00:00',
    'report_due',
    NOW() - INTERVAL '45 days'
WHERE NOT EXISTS (SELECT 1 FROM events WHERE name = 'AI Workshop');

-- ── Done ─────────────────────────────────────────────────────
-- Login: sarah.lead@graduate.utm.my / Password123!
