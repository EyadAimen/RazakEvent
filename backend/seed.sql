-- ============================================================
-- RazakEvent — Seed Data
-- Run AFTER the backend has started once so TypeORM creates
-- all tables via synchronize: true.
--
-- All passwords = Password123!
-- Hash: $2b$10$D5uthMQFirb.lencPQ.WuuhTojhTmrMvZ.ooMkMeGB5rVL5AhUZR2
--
-- Creates:
--   5 venues
--   1 admin | 3 leads | 3 members | 2 students
--   3 clubs (Tech Club, Culture Club, Sports Community)
--   9 proposals | 7 events
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

INSERT INTO venues (name, location)
SELECT 'Dewan Serbaguna, KTR', 'Block D, Kolej Tun Razak'
WHERE NOT EXISTS (SELECT 1 FROM venues WHERE name = 'Dewan Serbaguna, KTR');

INSERT INTO venues (name, location)
SELECT 'Sports Field, KTR', 'Outdoor Ground, Kolej Tun Razak'
WHERE NOT EXISTS (SELECT 1 FROM venues WHERE name = 'Sports Field, KTR');

-- ── 2. Clubs (lead_id linked after users are created) ────────

INSERT INTO clubs (name, type, description, lead_id, created_at)
SELECT 'Tech Club', 'club', 'Technology and innovation club for KTR students.', NULL, NOW() - INTERVAL '1 year'
WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'Tech Club');

INSERT INTO clubs (name, type, description, lead_id, created_at)
SELECT 'Culture Club', 'club', 'Promoting arts, culture and heritage among KTR students.', NULL, NOW() - INTERVAL '8 months'
WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'Culture Club');

INSERT INTO clubs (name, type, description, lead_id, created_at)
SELECT 'Sports Community', 'community', 'Organising sports activities and fitness events for KTR residents.', NULL, NOW() - INTERVAL '6 months'
WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'Sports Community');

-- ── 3. Users ─────────────────────────────────────────────────

-- Admin
INSERT INTO users (full_name, staff_or_matric_id, email, password_hash, role, "isEmailVerified", created_at)
SELECT 'Ahmad Razak', 'S20ADM001', 'admin.ktr@graduate.utm.my',
       '$2b$10$D5uthMQFirb.lencPQ.WuuhTojhTmrMvZ.ooMkMeGB5rVL5AhUZR2',
       'admin', true, NOW() - INTERVAL '2 years'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin.ktr@graduate.utm.my');

-- Lead 1 — Tech Club
INSERT INTO users (full_name, staff_or_matric_id, email, password_hash, role, "isEmailVerified", created_at)
SELECT 'Sarah Amirah', 'A22CS0001', 'sarah.lead@graduate.utm.my',
       '$2b$10$D5uthMQFirb.lencPQ.WuuhTojhTmrMvZ.ooMkMeGB5rVL5AhUZR2',
       'lead', true, NOW() - INTERVAL '1 year'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'sarah.lead@graduate.utm.my');

-- Lead 2 — Culture Club
INSERT INTO users (full_name, staff_or_matric_id, email, password_hash, role, "isEmailVerified", created_at)
SELECT 'Haziq Nabil', 'A22EE0021', 'haziq.lead@graduate.utm.my',
       '$2b$10$D5uthMQFirb.lencPQ.WuuhTojhTmrMvZ.ooMkMeGB5rVL5AhUZR2',
       'lead', true, NOW() - INTERVAL '8 months'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'haziq.lead@graduate.utm.my');

-- Lead 3 — Sports Community
INSERT INTO users (full_name, staff_or_matric_id, email, password_hash, role, "isEmailVerified", created_at)
SELECT 'Nurul Iman', 'A23ME0045', 'nurul.lead@graduate.utm.my',
       '$2b$10$D5uthMQFirb.lencPQ.WuuhTojhTmrMvZ.ooMkMeGB5rVL5AhUZR2',
       'lead', true, NOW() - INTERVAL '6 months'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'nurul.lead@graduate.utm.my');

-- Members
INSERT INTO users (full_name, staff_or_matric_id, email, password_hash, role, "isEmailVerified", created_at)
SELECT 'Ahmad Faiz', 'A23CS1001', 'ahmad.faiz@graduate.utm.my',
       '$2b$10$D5uthMQFirb.lencPQ.WuuhTojhTmrMvZ.ooMkMeGB5rVL5AhUZR2',
       'member', true, NOW() - INTERVAL '6 months'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'ahmad.faiz@graduate.utm.my');

INSERT INTO users (full_name, staff_or_matric_id, email, password_hash, role, "isEmailVerified", created_at)
SELECT 'Siti Nurhaliza', 'A23CS1002', 'siti.nurhaliza@graduate.utm.my',
       '$2b$10$D5uthMQFirb.lencPQ.WuuhTojhTmrMvZ.ooMkMeGB5rVL5AhUZR2',
       'member', true, NOW() - INTERVAL '5 months'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'siti.nurhaliza@graduate.utm.my');

INSERT INTO users (full_name, staff_or_matric_id, email, password_hash, role, "isEmailVerified", created_at)
SELECT 'Khairul Aizat', 'A23EE1010', 'khairul.aizat@graduate.utm.my',
       '$2b$10$D5uthMQFirb.lencPQ.WuuhTojhTmrMvZ.ooMkMeGB5rVL5AhUZR2',
       'member', true, NOW() - INTERVAL '4 months'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'khairul.aizat@graduate.utm.my');

-- Students
INSERT INTO users (full_name, staff_or_matric_id, email, password_hash, role, "isEmailVerified", created_at)
SELECT 'Izzatul Husna', 'A24CS2001', 'izzatul.husna@graduate.utm.my',
       '$2b$10$D5uthMQFirb.lencPQ.WuuhTojhTmrMvZ.ooMkMeGB5rVL5AhUZR2',
       'student', true, NOW() - INTERVAL '3 months'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'izzatul.husna@graduate.utm.my');

INSERT INTO users (full_name, staff_or_matric_id, email, password_hash, role, "isEmailVerified", created_at)
SELECT 'Nadia Zainudin', 'A24ME2010', 'nadia.zainudin@graduate.utm.my',
       '$2b$10$D5uthMQFirb.lencPQ.WuuhTojhTmrMvZ.ooMkMeGB5rVL5AhUZR2',
       'student', true, NOW() - INTERVAL '2 months'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'nadia.zainudin@graduate.utm.my');

-- Ensure all existing seed users have email verified
UPDATE users SET "isEmailVerified" = true
WHERE email IN (
    'admin.ktr@graduate.utm.my',
    'sarah.lead@graduate.utm.my',
    'haziq.lead@graduate.utm.my',
    'nurul.lead@graduate.utm.my',
    'ahmad.faiz@graduate.utm.my',
    'siti.nurhaliza@graduate.utm.my',
    'khairul.aizat@graduate.utm.my',
    'izzatul.husna@graduate.utm.my',
    'nadia.zainudin@graduate.utm.my'
);

-- ── 4. Link clubs → leads ─────────────────────────────────────

UPDATE clubs SET lead_id = (SELECT id FROM users WHERE email = 'sarah.lead@graduate.utm.my')
WHERE name = 'Tech Club';

UPDATE clubs SET lead_id = (SELECT id FROM users WHERE email = 'haziq.lead@graduate.utm.my')
WHERE name = 'Culture Club';

UPDATE clubs SET lead_id = (SELECT id FROM users WHERE email = 'nurul.lead@graduate.utm.my')
WHERE name = 'Sports Community';

-- ── 5. Club members ──────────────────────────────────────────

-- Ahmad Faiz → Tech Club (committee)
INSERT INTO club_members (user_id, club_id, joined_at)
SELECT
    (SELECT id FROM users WHERE email = 'ahmad.faiz@graduate.utm.my'),
    (SELECT id FROM clubs WHERE name = 'Tech Club'),
    NOW() - INTERVAL '5 months'
WHERE NOT EXISTS (
    SELECT 1 FROM club_members
    WHERE user_id = (SELECT id FROM users WHERE email = 'ahmad.faiz@graduate.utm.my')
    AND club_id = (SELECT id FROM clubs WHERE name = 'Tech Club')
);

-- Siti Nurhaliza → Culture Club (committee)
INSERT INTO club_members (user_id, club_id, joined_at)
SELECT
    (SELECT id FROM users WHERE email = 'siti.nurhaliza@graduate.utm.my'),
    (SELECT id FROM clubs WHERE name = 'Culture Club'),
    NOW() - INTERVAL '4 months'
WHERE NOT EXISTS (
    SELECT 1 FROM club_members
    WHERE user_id = (SELECT id FROM users WHERE email = 'siti.nurhaliza@graduate.utm.my')
    AND club_id = (SELECT id FROM clubs WHERE name = 'Culture Club')
);

-- Khairul Aizat → Sports Community (committee)
INSERT INTO club_members (user_id, club_id, joined_at)
SELECT
    (SELECT id FROM users WHERE email = 'khairul.aizat@graduate.utm.my'),
    (SELECT id FROM clubs WHERE name = 'Sports Community'),
    NOW() - INTERVAL '3 months'
WHERE NOT EXISTS (
    SELECT 1 FROM club_members
    WHERE user_id = (SELECT id FROM users WHERE email = 'khairul.aizat@graduate.utm.my')
    AND club_id = (SELECT id FROM clubs WHERE name = 'Sports Community')
);

-- ── 6. Proposals ─────────────────────────────────────────────

-- ── Tech Club (Sarah) ──

INSERT INTO event_proposals (lead_id, club_id, venue_id, event_name, proposed_date, description, estimated_budget, status, submitted_at, reviewed_at, created_at)
SELECT
    (SELECT id FROM users WHERE email = 'sarah.lead@graduate.utm.my'),
    (SELECT id FROM clubs WHERE name = 'Tech Club'),
    (SELECT id FROM venues WHERE name = 'Dewan Tun Hussein Onn, KTR'),
    'Tech Symposium 2026', '2026-05-15 09:00:00',
    'Annual technology symposium bringing together students and industry professionals.',
    5000.00, 'approved',
    NOW() - INTERVAL '30 days', NOW() - INTERVAL '25 days', NOW() - INTERVAL '30 days'
WHERE NOT EXISTS (SELECT 1 FROM event_proposals WHERE event_name = 'Tech Symposium 2026');

INSERT INTO event_proposals (lead_id, club_id, venue_id, event_name, proposed_date, description, estimated_budget, status, submitted_at, created_at)
SELECT
    (SELECT id FROM users WHERE email = 'sarah.lead@graduate.utm.my'),
    (SELECT id FROM clubs WHERE name = 'Tech Club'),
    (SELECT id FROM venues WHERE name = 'Computer Lab 1, KTR'),
    'Hackathon Kickoff', '2026-06-20 08:00:00',
    '24-hour hackathon open to all KTR students.',
    2000.00, 'pending',
    NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'
WHERE NOT EXISTS (SELECT 1 FROM event_proposals WHERE event_name = 'Hackathon Kickoff');

INSERT INTO event_proposals (lead_id, club_id, venue_id, event_name, proposed_date, description, estimated_budget, status, submitted_at, reviewed_at, created_at)
SELECT
    (SELECT id FROM users WHERE email = 'sarah.lead@graduate.utm.my'),
    (SELECT id FROM clubs WHERE name = 'Tech Club'),
    (SELECT id FROM venues WHERE name = 'Seminar Room A, KTR'),
    'AI Workshop', '2026-04-10 09:00:00',
    'Hands-on workshop covering machine learning fundamentals.',
    1500.00, 'approved',
    NOW() - INTERVAL '50 days', NOW() - INTERVAL '45 days', NOW() - INTERVAL '50 days'
WHERE NOT EXISTS (SELECT 1 FROM event_proposals WHERE event_name = 'AI Workshop');

-- ── Culture Club (Haziq) ──

INSERT INTO event_proposals (lead_id, club_id, venue_id, event_name, proposed_date, description, estimated_budget, status, submitted_at, reviewed_at, created_at)
SELECT
    (SELECT id FROM users WHERE email = 'haziq.lead@graduate.utm.my'),
    (SELECT id FROM clubs WHERE name = 'Culture Club'),
    (SELECT id FROM venues WHERE name = 'Dewan Serbaguna, KTR'),
    'Cultural Night 2026', '2026-04-05 19:00:00',
    'Annual cultural showcase featuring traditional performances and food from across Malaysia.',
    3500.00, 'approved',
    NOW() - INTERVAL '60 days', NOW() - INTERVAL '55 days', NOW() - INTERVAL '60 days'
WHERE NOT EXISTS (SELECT 1 FROM event_proposals WHERE event_name = 'Cultural Night 2026');

INSERT INTO event_proposals (lead_id, club_id, venue_id, event_name, proposed_date, description, estimated_budget, status, submitted_at, created_at)
SELECT
    (SELECT id FROM users WHERE email = 'haziq.lead@graduate.utm.my'),
    (SELECT id FROM clubs WHERE name = 'Culture Club'),
    (SELECT id FROM venues WHERE name = 'Seminar Room A, KTR'),
    'Batik Workshop', '2026-06-10 10:00:00',
    'Traditional batik painting workshop for KTR students.',
    800.00, 'pending',
    NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'
WHERE NOT EXISTS (SELECT 1 FROM event_proposals WHERE event_name = 'Batik Workshop');

INSERT INTO event_proposals (lead_id, club_id, venue_id, event_name, proposed_date, description, estimated_budget, status, submitted_at, created_at)
SELECT
    (SELECT id FROM users WHERE email = 'haziq.lead@graduate.utm.my'),
    (SELECT id FROM clubs WHERE name = 'Culture Club'),
    NULL,
    'Art Exhibition 2026', '2026-07-01 09:00:00',
    'Student art exhibition showcasing creative works from KTR residents.',
    1200.00, 'draft',
    NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM event_proposals WHERE event_name = 'Art Exhibition 2026');

-- ── Sports Community (Nurul) ──

INSERT INTO event_proposals (lead_id, club_id, venue_id, event_name, proposed_date, description, estimated_budget, status, submitted_at, reviewed_at, created_at)
SELECT
    (SELECT id FROM users WHERE email = 'nurul.lead@graduate.utm.my'),
    (SELECT id FROM clubs WHERE name = 'Sports Community'),
    (SELECT id FROM venues WHERE name = 'Sports Field, KTR'),
    'Sports Carnival 2026', '2026-05-25 08:00:00',
    'Inter-college sports carnival with multiple sports categories.',
    6000.00, 'approved',
    NOW() - INTERVAL '20 days', NOW() - INTERVAL '15 days', NOW() - INTERVAL '20 days'
WHERE NOT EXISTS (SELECT 1 FROM event_proposals WHERE event_name = 'Sports Carnival 2026');

INSERT INTO event_proposals (lead_id, club_id, venue_id, event_name, proposed_date, description, estimated_budget, status, submitted_at, reviewed_at, created_at)
SELECT
    (SELECT id FROM users WHERE email = 'nurul.lead@graduate.utm.my'),
    (SELECT id FROM clubs WHERE name = 'Sports Community'),
    (SELECT id FROM venues WHERE name = 'Sports Field, KTR'),
    'Fun Run 5K', '2026-03-20 07:00:00',
    '5km fun run around the UTM campus open to all students.',
    1500.00, 'approved',
    NOW() - INTERVAL '70 days', NOW() - INTERVAL '65 days', NOW() - INTERVAL '70 days'
WHERE NOT EXISTS (SELECT 1 FROM event_proposals WHERE event_name = 'Fun Run 5K');

INSERT INTO event_proposals (lead_id, club_id, venue_id, event_name, proposed_date, description, estimated_budget, status, submitted_at, created_at)
SELECT
    (SELECT id FROM users WHERE email = 'nurul.lead@graduate.utm.my'),
    (SELECT id FROM clubs WHERE name = 'Sports Community'),
    (SELECT id FROM venues WHERE name = 'Dewan Serbaguna, KTR'),
    'Volleyball Tournament', '2026-07-10 09:00:00',
    'KTR internal volleyball tournament for college residents.',
    900.00, 'pending',
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
WHERE NOT EXISTS (SELECT 1 FROM event_proposals WHERE event_name = 'Volleyball Tournament');

-- ── 7. Events (approved proposals only) ──────────────────────

-- Tech Club events
INSERT INTO events (proposal_id, club_id, venue_id, name, description, event_date, status, created_at)
SELECT
    (SELECT id FROM event_proposals WHERE event_name = 'Tech Symposium 2026'),
    (SELECT id FROM clubs WHERE name = 'Tech Club'),
    (SELECT id FROM venues WHERE name = 'Dewan Tun Hussein Onn, KTR'),
    'Tech Symposium 2026',
    'Annual technology symposium bringing together students and industry professionals.',
    '2026-05-15 09:00:00', 'approved', NOW() - INTERVAL '25 days'
WHERE NOT EXISTS (SELECT 1 FROM events WHERE name = 'Tech Symposium 2026');

INSERT INTO events (proposal_id, club_id, venue_id, name, description, event_date, status, created_at)
SELECT
    (SELECT id FROM event_proposals WHERE event_name = 'AI Workshop'),
    (SELECT id FROM clubs WHERE name = 'Tech Club'),
    (SELECT id FROM venues WHERE name = 'Seminar Room A, KTR'),
    'AI Workshop',
    'Hands-on workshop covering machine learning fundamentals.',
    '2026-04-10 09:00:00', 'report_due', NOW() - INTERVAL '45 days'
WHERE NOT EXISTS (SELECT 1 FROM events WHERE name = 'AI Workshop');

-- Culture Club events
INSERT INTO events (proposal_id, club_id, venue_id, name, description, event_date, status, created_at)
SELECT
    (SELECT id FROM event_proposals WHERE event_name = 'Cultural Night 2026'),
    (SELECT id FROM clubs WHERE name = 'Culture Club'),
    (SELECT id FROM venues WHERE name = 'Dewan Serbaguna, KTR'),
    'Cultural Night 2026',
    'Annual cultural showcase featuring traditional performances and food from across Malaysia.',
    '2026-04-05 19:00:00', 'completed', NOW() - INTERVAL '55 days'
WHERE NOT EXISTS (SELECT 1 FROM events WHERE name = 'Cultural Night 2026');

-- Sports Community events
INSERT INTO events (proposal_id, club_id, venue_id, name, description, event_date, status, created_at)
SELECT
    (SELECT id FROM event_proposals WHERE event_name = 'Sports Carnival 2026'),
    (SELECT id FROM clubs WHERE name = 'Sports Community'),
    (SELECT id FROM venues WHERE name = 'Sports Field, KTR'),
    'Sports Carnival 2026',
    'Inter-college sports carnival with multiple sports categories.',
    '2026-05-25 08:00:00', 'approved', NOW() - INTERVAL '15 days'
WHERE NOT EXISTS (SELECT 1 FROM events WHERE name = 'Sports Carnival 2026');

INSERT INTO events (proposal_id, club_id, venue_id, name, description, event_date, status, created_at)
SELECT
    (SELECT id FROM event_proposals WHERE event_name = 'Fun Run 5K'),
    (SELECT id FROM clubs WHERE name = 'Sports Community'),
    (SELECT id FROM venues WHERE name = 'Sports Field, KTR'),
    'Fun Run 5K',
    '5km fun run around the UTM campus open to all students.',
    '2026-03-20 07:00:00', 'completed', NOW() - INTERVAL '65 days'
WHERE NOT EXISTS (SELECT 1 FROM events WHERE name = 'Fun Run 5K');

-- ── Done ─────────────────────────────────────────────────────
-- All passwords: Password123!
--
-- admin.ktr@graduate.utm.my          → admin
-- sarah.lead@graduate.utm.my         → lead  (Tech Club)
-- haziq.lead@graduate.utm.my         → lead  (Culture Club)
-- nurul.lead@graduate.utm.my         → lead  (Sports Community)
-- ahmad.faiz@graduate.utm.my         → member (Tech Club)
-- siti.nurhaliza@graduate.utm.my     → member (Culture Club)
-- khairul.aizat@graduate.utm.my      → member (Sports Community)
-- izzatul.husna@graduate.utm.my      → student
-- nadia.zainudin@graduate.utm.my     → student
