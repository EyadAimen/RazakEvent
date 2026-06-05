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

-- ── 0. Schema patches (idempotent — safe to re-run) ─────────
-- Adds new columns that TypeORM would normally add via synchronize.
-- Running these here makes the seed self-contained.

ALTER TABLE clubs
    ADD COLUMN IF NOT EXISTS category        VARCHAR(100),
    ADD COLUMN IF NOT EXISTS faculty_advisor VARCHAR,
    ADD COLUMN IF NOT EXISTS objectives      TEXT,
    ADD COLUMN IF NOT EXISTS deleted_at      TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS deleted_by      UUID,
    ADD COLUMN IF NOT EXISTS delete_reason   TEXT;

ALTER TABLE club_requests
    ADD COLUMN IF NOT EXISTS category              VARCHAR(100),
    ADD COLUMN IF NOT EXISTS supporting_letter_path TEXT;

-- Fix event dates that are now in the past for approved/ongoing events
UPDATE events SET event_date = '2026-08-15 09:00:00' WHERE name = 'Tech Symposium 2026'    AND status IN ('approved', 'ongoing');
UPDATE events SET event_date = '2026-08-25 08:00:00' WHERE name = 'Sports Carnival 2026'   AND status IN ('approved', 'ongoing');
UPDATE events SET event_date = '2026-09-12 09:00:00' WHERE name = 'KTR CTF 2026 Season Opener' AND status IN ('approved', 'ongoing');
UPDATE events SET event_date = '2026-09-28 14:00:00' WHERE name = 'Guest Lecture: Threat Intelligence in 2026' AND status IN ('approved', 'ongoing');

-- Fix proposal dates to match
UPDATE event_proposals SET proposed_date = '2026-08-15 09:00:00' WHERE event_name = 'Tech Symposium 2026';
UPDATE event_proposals SET proposed_date = '2026-09-20 08:00:00' WHERE event_name = 'Hackathon Kickoff';
UPDATE event_proposals SET proposed_date = '2026-09-10 10:00:00' WHERE event_name = 'Batik Workshop';
UPDATE event_proposals SET proposed_date = '2026-08-25 08:00:00' WHERE event_name = 'Sports Carnival 2026';
UPDATE event_proposals SET proposed_date = '2026-10-10 09:00:00' WHERE event_name = 'Volleyball Tournament';
UPDATE event_proposals SET proposed_date = '2026-10-01 09:00:00' WHERE event_name = 'Art Exhibition 2026';
UPDATE event_proposals SET proposed_date = '2026-09-12 09:00:00' WHERE event_name = 'KTR CTF 2026 Season Opener';
UPDATE event_proposals SET proposed_date = '2026-09-28 14:00:00' WHERE event_name = 'Guest Lecture: Threat Intelligence in 2026';
UPDATE event_proposals SET proposed_date = '2026-10-05 10:00:00' WHERE event_name = 'Zero Waste Workshop';

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
    'Tech Symposium 2026', '2026-08-15 09:00:00',
    'Annual technology symposium bringing together students and industry professionals.',
    5000.00, 'approved',
    NOW() - INTERVAL '30 days', NOW() - INTERVAL '25 days', NOW() - INTERVAL '30 days'
WHERE NOT EXISTS (SELECT 1 FROM event_proposals WHERE event_name = 'Tech Symposium 2026');

INSERT INTO event_proposals (lead_id, club_id, venue_id, event_name, proposed_date, description, estimated_budget, status, submitted_at, created_at)
SELECT
    (SELECT id FROM users WHERE email = 'sarah.lead@graduate.utm.my'),
    (SELECT id FROM clubs WHERE name = 'Tech Club'),
    (SELECT id FROM venues WHERE name = 'Computer Lab 1, KTR'),
    'Hackathon Kickoff', '2026-09-20 08:00:00',
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
    'Batik Workshop', '2026-09-10 10:00:00',
    'Traditional batik painting workshop for KTR students.',
    800.00, 'pending',
    NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'
WHERE NOT EXISTS (SELECT 1 FROM event_proposals WHERE event_name = 'Batik Workshop');

INSERT INTO event_proposals (lead_id, club_id, venue_id, event_name, proposed_date, description, estimated_budget, status, submitted_at, created_at)
SELECT
    (SELECT id FROM users WHERE email = 'haziq.lead@graduate.utm.my'),
    (SELECT id FROM clubs WHERE name = 'Culture Club'),
    NULL,
    'Art Exhibition 2026', '2026-10-01 09:00:00',
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
    'Sports Carnival 2026', '2026-08-25 08:00:00',
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
    'Volleyball Tournament', '2026-10-10 09:00:00',
    'KTR internal volleyball tournament for college residents.',
    900.00, 'pending',
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
WHERE NOT EXISTS (SELECT 1 FROM event_proposals WHERE event_name = 'Volleyball Tournament');

-- ── 7. Events (approved proposals only) ──────────────────────

-- Tech Club events
INSERT INTO events (proposal_id, club_id, venue_id, name, description, event_date, status, volunteering_status, created_at)
SELECT p.id, p.club_id, p.venue_id, p.event_name, p.description, p.proposed_date, 'approved', 'open', NOW() - INTERVAL '25 days'
FROM event_proposals p
WHERE p.event_name = 'Tech Symposium 2026'
AND NOT EXISTS (SELECT 1 FROM events WHERE name = 'Tech Symposium 2026');

INSERT INTO events (proposal_id, club_id, venue_id, name, description, event_date, status, volunteering_status, created_at)
SELECT p.id, p.club_id, p.venue_id, p.event_name, p.description, p.proposed_date, 'report_due', 'closed', NOW() - INTERVAL '45 days'
FROM event_proposals p
WHERE p.event_name = 'AI Workshop'
AND NOT EXISTS (SELECT 1 FROM events WHERE name = 'AI Workshop');

-- Culture Club events
INSERT INTO events (proposal_id, club_id, venue_id, name, description, event_date, status, volunteering_status, created_at)
SELECT p.id, p.club_id, p.venue_id, p.event_name, p.description, p.proposed_date, 'completed', 'closed', NOW() - INTERVAL '55 days'
FROM event_proposals p
WHERE p.event_name = 'Cultural Night 2026'
AND NOT EXISTS (SELECT 1 FROM events WHERE name = 'Cultural Night 2026');

-- Sports Community events
INSERT INTO events (proposal_id, club_id, venue_id, name, description, event_date, status, volunteering_status, created_at)
SELECT p.id, p.club_id, p.venue_id, p.event_name, p.description, p.proposed_date, 'approved', 'open', NOW() - INTERVAL '15 days'
FROM event_proposals p
WHERE p.event_name = 'Sports Carnival 2026'
AND NOT EXISTS (SELECT 1 FROM events WHERE name = 'Sports Carnival 2026');

INSERT INTO events (proposal_id, club_id, venue_id, name, description, event_date, status, volunteering_status, created_at)
SELECT p.id, p.club_id, p.venue_id, p.event_name, p.description, p.proposed_date, 'completed', 'closed', NOW() - INTERVAL '65 days'
FROM event_proposals p
WHERE p.event_name = 'Fun Run 5K'
AND NOT EXISTS (SELECT 1 FROM events WHERE name = 'Fun Run 5K');

-- ── 8. Update existing clubs with new metadata columns ───────

UPDATE clubs SET
    category       = 'Technology',
    faculty_advisor = 'Dr. Siti Aminah',
    objectives     = '["Host monthly tech talks and workshops","Run coding bootcamps for beginners","Organise inter-college hackathons","Collaborate with industry for internship pipelines"]'
WHERE name = 'Tech Club' AND category IS NULL;

UPDATE clubs SET
    category       = 'Arts & Culture',
    faculty_advisor = 'Dr. Rosmah Binti Ariffin',
    objectives     = '["Showcase Malaysian cultural heritage","Host annual cultural night","Run creative arts workshops","Build cultural exchange with other colleges"]'
WHERE name = 'Culture Club' AND category IS NULL;

UPDATE clubs SET
    category       = 'Sports & Fitness',
    faculty_advisor = 'En. Farid Azri',
    objectives     = '["Organise inter-college sports tournaments","Promote health and fitness among students","Run weekly recreational activities","Represent KTR in UTM sports events"]'
WHERE name = 'Sports Community' AND category IS NULL;

-- ── 9. Additional venues ──────────────────────────────────────

INSERT INTO venues (name, location)
SELECT 'Lab Block C, Room 204', 'Block C, Kolej Tun Razak'
WHERE NOT EXISTS (SELECT 1 FROM venues WHERE name = 'Lab Block C, Room 204');

INSERT INTO venues (name, location)
SELECT 'Auditorium B, KTR', 'Block E, Kolej Tun Razak'
WHERE NOT EXISTS (SELECT 1 FROM venues WHERE name = 'Auditorium B, KTR');

-- ── 10. Additional users ──────────────────────────────────────

-- Lead: Adam Lee — will lead Cybersecurity KTR AND Photography Society (multi-club lead)
INSERT INTO users (full_name, staff_or_matric_id, email, password_hash, role, "isEmailVerified", created_at)
SELECT 'Adam Lee Zheng Wei', 'A22CS0101', 'adam.lee@graduate.utm.my',
       '$2b$10$D5uthMQFirb.lencPQ.WuuhTojhTmrMvZ.ooMkMeGB5rVL5AhUZR2',
       'lead', true, NOW() - INTERVAL '9 months'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'adam.lee@graduate.utm.my');

-- Lead: Nadia Hassan — leads Green Earth Initiative
INSERT INTO users (full_name, staff_or_matric_id, email, password_hash, role, "isEmailVerified", created_at)
SELECT 'Nadia Hassan', 'A22CE0056', 'nadia.hassan@graduate.utm.my',
       '$2b$10$D5uthMQFirb.lencPQ.WuuhTojhTmrMvZ.ooMkMeGB5rVL5AhUZR2',
       'lead', true, NOW() - INTERVAL '7 months'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'nadia.hassan@graduate.utm.my');

-- Members (dedicated per club to avoid cross-club constraints)
INSERT INTO users (full_name, staff_or_matric_id, email, password_hash, role, "isEmailVerified", created_at)
SELECT 'Chen Wei Liang', 'A23CS1050', 'chen.wei@graduate.utm.my',
       '$2b$10$D5uthMQFirb.lencPQ.WuuhTojhTmrMvZ.ooMkMeGB5rVL5AhUZR2',
       'member', true, NOW() - INTERVAL '7 months'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'chen.wei@graduate.utm.my');

INSERT INTO users (full_name, staff_or_matric_id, email, password_hash, role, "isEmailVerified", created_at)
SELECT 'Priya Nair', 'A23CS1055', 'priya.nair@graduate.utm.my',
       '$2b$10$D5uthMQFirb.lencPQ.WuuhTojhTmrMvZ.ooMkMeGB5rVL5AhUZR2',
       'member', true, NOW() - INTERVAL '6 months'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'priya.nair@graduate.utm.my');

INSERT INTO users (full_name, staff_or_matric_id, email, password_hash, role, "isEmailVerified", created_at)
SELECT 'Marcus Tan Jian Hao', 'A23CS1060', 'marcus.tan@graduate.utm.my',
       '$2b$10$D5uthMQFirb.lencPQ.WuuhTojhTmrMvZ.ooMkMeGB5rVL5AhUZR2',
       'member', true, NOW() - INTERVAL '5 months'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'marcus.tan@graduate.utm.my');

INSERT INTO users (full_name, staff_or_matric_id, email, password_hash, role, "isEmailVerified", created_at)
SELECT 'Liyana Binti Zulkifli', 'A23ET1021', 'liyana.zulkifli@graduate.utm.my',
       '$2b$10$D5uthMQFirb.lencPQ.WuuhTojhTmrMvZ.ooMkMeGB5rVL5AhUZR2',
       'member', true, NOW() - INTERVAL '5 months'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'liyana.zulkifli@graduate.utm.my');

INSERT INTO users (full_name, staff_or_matric_id, email, password_hash, role, "isEmailVerified", created_at)
SELECT 'Kevin Wong', 'A23ME1077', 'kevin.wong@graduate.utm.my',
       '$2b$10$D5uthMQFirb.lencPQ.WuuhTojhTmrMvZ.ooMkMeGB5rVL5AhUZR2',
       'member', true, NOW() - INTERVAL '4 months'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'kevin.wong@graduate.utm.my');

-- Students who will have pending club requests
INSERT INTO users (full_name, staff_or_matric_id, email, password_hash, role, "isEmailVerified", created_at)
SELECT 'Alif Zulkifli', 'A24CS3001', 'alif.zulkifli@graduate.utm.my',
       '$2b$10$D5uthMQFirb.lencPQ.WuuhTojhTmrMvZ.ooMkMeGB5rVL5AhUZR2',
       'student', true, NOW() - INTERVAL '2 months'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'alif.zulkifli@graduate.utm.my');

INSERT INTO users (full_name, staff_or_matric_id, email, password_hash, role, "isEmailVerified", created_at)
SELECT 'Sarah Binti Idris', 'A24EE3010', 'sarah.binti@graduate.utm.my',
       '$2b$10$D5uthMQFirb.lencPQ.WuuhTojhTmrMvZ.ooMkMeGB5rVL5AhUZR2',
       'student', true, NOW() - INTERVAL '1 month'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'sarah.binti@graduate.utm.my');

INSERT INTO users (full_name, staff_or_matric_id, email, password_hash, role, "isEmailVerified", created_at)
SELECT 'Chen Wei Liang Jr', 'A24CS3020', 'chenweil.jr@graduate.utm.my',
       '$2b$10$D5uthMQFirb.lencPQ.WuuhTojhTmrMvZ.ooMkMeGB5rVL5AhUZR2',
       'student', true, NOW() - INTERVAL '3 weeks'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'chenweil.jr@graduate.utm.my');

UPDATE users SET "isEmailVerified" = true WHERE email IN (
    'adam.lee@graduate.utm.my', 'nadia.hassan@graduate.utm.my',
    'chen.wei@graduate.utm.my', 'priya.nair@graduate.utm.my',
    'marcus.tan@graduate.utm.my', 'liyana.zulkifli@graduate.utm.my',
    'kevin.wong@graduate.utm.my', 'alif.zulkifli@graduate.utm.my',
    'sarah.binti@graduate.utm.my', 'chenweil.jr@graduate.utm.my'
);

-- ── 11. New clubs (with category, faculty_advisor, objectives) ─

INSERT INTO clubs (name, type, description, category, faculty_advisor, objectives, lead_id, created_at)
SELECT
    'Cybersecurity KTR', 'club',
    'A club dedicated to ethical hacking, cybersecurity awareness, and CTF competitions for KTR students. We build security-minded engineers through workshops, guest lectures, and hands-on labs.',
    'Technology',
    'Dr. Azlan Rashid',
    '["Host bi-monthly CTF competitions open to all students","Conduct cybersecurity awareness workshops each semester","Collaborate with industry partners for internship pipelines","Maintain a shared lab environment for hands-on learning"]',
    (SELECT id FROM users WHERE email = 'adam.lee@graduate.utm.my'),
    NOW() - INTERVAL '8 months'
WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'Cybersecurity KTR');

INSERT INTO clubs (name, type, description, category, faculty_advisor, objectives, lead_id, created_at)
SELECT
    'Green Earth Initiative', 'community',
    'An environmental community focused on sustainability, eco-awareness, and green campus initiatives at KTR and UTM.',
    'Environment',
    'Dr. Siti Rahimah',
    '["Plant 500 trees across the UTM campus by 2027","Reduce single-use plastic usage in KTR by 60%","Organise monthly campus clean-up drives","Run eco-awareness campaigns for new students"]',
    (SELECT id FROM users WHERE email = 'nadia.hassan@graduate.utm.my'),
    NOW() - INTERVAL '6 months'
WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'Green Earth Initiative');

-- Photography Society — also led by Adam Lee to test multi-club lead feature
INSERT INTO clubs (name, type, description, category, faculty_advisor, objectives, lead_id, created_at)
SELECT
    'Photography Society', 'club',
    'A creative space for KTR students passionate about photography — from mobile shots to DSLR techniques, photo editing, and exhibitions.',
    'Arts & Media',
    NULL,
    '["Host semester photography exhibitions","Run weekly photo-walk sessions around UTM","Teach editing skills through monthly workshops","Build a digital archive of KTR events"]',
    (SELECT id FROM users WHERE email = 'adam.lee@graduate.utm.my'),
    NOW() - INTERVAL '3 months'
WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'Photography Society');

-- ── 12. Club members for new clubs ────────────────────────────

-- Cybersecurity KTR
INSERT INTO club_members (user_id, club_id, joined_at)
SELECT (SELECT id FROM users WHERE email = 'chen.wei@graduate.utm.my'),
       (SELECT id FROM clubs WHERE name = 'Cybersecurity KTR'),
       NOW() - INTERVAL '7 months'
WHERE NOT EXISTS (
    SELECT 1 FROM club_members
    WHERE user_id = (SELECT id FROM users WHERE email = 'chen.wei@graduate.utm.my')
    AND club_id = (SELECT id FROM clubs WHERE name = 'Cybersecurity KTR')
);

INSERT INTO club_members (user_id, club_id, joined_at)
SELECT (SELECT id FROM users WHERE email = 'priya.nair@graduate.utm.my'),
       (SELECT id FROM clubs WHERE name = 'Cybersecurity KTR'),
       NOW() - INTERVAL '6 months'
WHERE NOT EXISTS (
    SELECT 1 FROM club_members
    WHERE user_id = (SELECT id FROM users WHERE email = 'priya.nair@graduate.utm.my')
    AND club_id = (SELECT id FROM clubs WHERE name = 'Cybersecurity KTR')
);

INSERT INTO club_members (user_id, club_id, joined_at)
SELECT (SELECT id FROM users WHERE email = 'marcus.tan@graduate.utm.my'),
       (SELECT id FROM clubs WHERE name = 'Cybersecurity KTR'),
       NOW() - INTERVAL '5 months'
WHERE NOT EXISTS (
    SELECT 1 FROM club_members
    WHERE user_id = (SELECT id FROM users WHERE email = 'marcus.tan@graduate.utm.my')
    AND club_id = (SELECT id FROM clubs WHERE name = 'Cybersecurity KTR')
);

-- Green Earth Initiative
INSERT INTO club_members (user_id, club_id, joined_at)
SELECT (SELECT id FROM users WHERE email = 'liyana.zulkifli@graduate.utm.my'),
       (SELECT id FROM clubs WHERE name = 'Green Earth Initiative'),
       NOW() - INTERVAL '5 months'
WHERE NOT EXISTS (
    SELECT 1 FROM club_members
    WHERE user_id = (SELECT id FROM users WHERE email = 'liyana.zulkifli@graduate.utm.my')
    AND club_id = (SELECT id FROM clubs WHERE name = 'Green Earth Initiative')
);

INSERT INTO club_members (user_id, club_id, joined_at)
SELECT (SELECT id FROM users WHERE email = 'kevin.wong@graduate.utm.my'),
       (SELECT id FROM clubs WHERE name = 'Green Earth Initiative'),
       NOW() - INTERVAL '4 months'
WHERE NOT EXISTS (
    SELECT 1 FROM club_members
    WHERE user_id = (SELECT id FROM users WHERE email = 'kevin.wong@graduate.utm.my')
    AND club_id = (SELECT id FROM clubs WHERE name = 'Green Earth Initiative')
);

-- Multi-club membership examples (same user in multiple clubs)
-- Ahmad Faiz: Tech Club (section 5) + Cybersecurity KTR
INSERT INTO club_members (user_id, club_id, joined_at)
SELECT (SELECT id FROM users WHERE email = 'ahmad.faiz@graduate.utm.my'),
       (SELECT id FROM clubs WHERE name = 'Cybersecurity KTR'),
       NOW() - INTERVAL '4 months'
WHERE NOT EXISTS (
    SELECT 1 FROM club_members
    WHERE user_id = (SELECT id FROM users WHERE email = 'ahmad.faiz@graduate.utm.my')
    AND club_id = (SELECT id FROM clubs WHERE name = 'Cybersecurity KTR')
);

-- Chen Wei: Cybersecurity KTR (above) + Photography Society
INSERT INTO club_members (user_id, club_id, joined_at)
SELECT (SELECT id FROM users WHERE email = 'chen.wei@graduate.utm.my'),
       (SELECT id FROM clubs WHERE name = 'Photography Society'),
       NOW() - INTERVAL '3 months'
WHERE NOT EXISTS (
    SELECT 1 FROM club_members
    WHERE user_id = (SELECT id FROM users WHERE email = 'chen.wei@graduate.utm.my')
    AND club_id = (SELECT id FROM clubs WHERE name = 'Photography Society')
);

-- ── 13. Pending club requests (tests admin approval UI) ────────

-- Mental Health Allies — community, Wellness — by Alif
INSERT INTO club_requests (student_id, club_name, club_type, description, category, status, submitted_at)
SELECT
    (SELECT id FROM users WHERE email = 'alif.zulkifli@graduate.utm.my'),
    'Mental Health Allies', 'community',
    'A peer-support community focused on mental wellness, stress management workshops, and creating safe spaces for students to openly discuss their mental health challenges.',
    'Wellness',
    'pending',
    NOW() - INTERVAL '5 days'
WHERE NOT EXISTS (
    SELECT 1 FROM club_requests
    WHERE student_id = (SELECT id FROM users WHERE email = 'alif.zulkifli@graduate.utm.my')
    AND status = 'pending'
);

-- Entrepreneurship Hub — club, Business — by Sarah
INSERT INTO club_requests (student_id, club_name, club_type, description, category, status, submitted_at)
SELECT
    (SELECT id FROM users WHERE email = 'sarah.binti@graduate.utm.my'),
    'Entrepreneurship Hub', 'club',
    'A startup-minded club hosting pitch competitions, startup weekends, and mentorship sessions with industry founders. Building the next generation of Malaysian entrepreneurs from KTR.',
    'Business',
    'pending',
    NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (
    SELECT 1 FROM club_requests
    WHERE student_id = (SELECT id FROM users WHERE email = 'sarah.binti@graduate.utm.my')
    AND status = 'pending'
);

-- ── 14. Proposals + events for new clubs ──────────────────────

-- Cybersecurity KTR: 2 approved proposals → 2 events
INSERT INTO event_proposals (lead_id, club_id, venue_id, event_name, proposed_date, description, estimated_budget, status, submitted_at, reviewed_at, created_at)
SELECT
    (SELECT id FROM users WHERE email = 'adam.lee@graduate.utm.my'),
    (SELECT id FROM clubs WHERE name = 'Cybersecurity KTR'),
    (SELECT id FROM venues WHERE name = 'Lab Block C, Room 204'),
    'KTR CTF 2026 Season Opener', '2026-09-12 09:00:00',
    'Capture-the-flag competition open to all KTR students to test their hacking and problem-solving skills.',
    1200.00, 'approved',
    NOW() - INTERVAL '35 days', NOW() - INTERVAL '30 days', NOW() - INTERVAL '35 days'
WHERE NOT EXISTS (SELECT 1 FROM event_proposals WHERE event_name = 'KTR CTF 2026 Season Opener');

INSERT INTO event_proposals (lead_id, club_id, venue_id, event_name, proposed_date, description, estimated_budget, status, submitted_at, reviewed_at, created_at)
SELECT
    (SELECT id FROM users WHERE email = 'adam.lee@graduate.utm.my'),
    (SELECT id FROM clubs WHERE name = 'Cybersecurity KTR'),
    (SELECT id FROM venues WHERE name = 'Auditorium B, KTR'),
    'Guest Lecture: Threat Intelligence in 2026', '2026-09-28 14:00:00',
    'Industry guest lecture on modern threat intelligence and security operations for KTR students.',
    500.00, 'approved',
    NOW() - INTERVAL '20 days', NOW() - INTERVAL '16 days', NOW() - INTERVAL '20 days'
WHERE NOT EXISTS (SELECT 1 FROM event_proposals WHERE event_name = 'Guest Lecture: Threat Intelligence in 2026');

INSERT INTO events (proposal_id, club_id, venue_id, name, description, event_date, status, volunteering_status, created_at)
SELECT p.id, p.club_id, p.venue_id, p.event_name, p.description, p.proposed_date, 'approved', 'open', NOW() - INTERVAL '30 days'
FROM event_proposals p
WHERE p.event_name = 'KTR CTF 2026 Season Opener'
AND NOT EXISTS (SELECT 1 FROM events WHERE name = 'KTR CTF 2026 Season Opener');

INSERT INTO events (proposal_id, club_id, venue_id, name, description, event_date, status, volunteering_status, created_at)
SELECT p.id, p.club_id, p.venue_id, p.event_name, p.description, p.proposed_date, 'approved', 'closed', NOW() - INTERVAL '16 days'
FROM event_proposals p
WHERE p.event_name = 'Guest Lecture: Threat Intelligence in 2026'
AND NOT EXISTS (SELECT 1 FROM events WHERE name = 'Guest Lecture: Threat Intelligence in 2026');

-- Green Earth Initiative: 1 approved proposal → 1 completed event + 1 pending proposal
INSERT INTO event_proposals (lead_id, club_id, venue_id, event_name, proposed_date, description, estimated_budget, status, submitted_at, reviewed_at, created_at)
SELECT
    (SELECT id FROM users WHERE email = 'nadia.hassan@graduate.utm.my'),
    (SELECT id FROM clubs WHERE name = 'Green Earth Initiative'),
    (SELECT id FROM venues WHERE name = 'Sports Field, KTR'),
    'Campus Clean-Up Drive', '2026-05-10 08:00:00',
    'Monthly campus clean-up and recycling awareness activity for all KTR residents.',
    300.00, 'approved',
    NOW() - INTERVAL '28 days', NOW() - INTERVAL '24 days', NOW() - INTERVAL '28 days'
WHERE NOT EXISTS (SELECT 1 FROM event_proposals WHERE event_name = 'Campus Clean-Up Drive');

INSERT INTO event_proposals (lead_id, club_id, venue_id, event_name, proposed_date, description, estimated_budget, status, submitted_at, created_at)
SELECT
    (SELECT id FROM users WHERE email = 'nadia.hassan@graduate.utm.my'),
    (SELECT id FROM clubs WHERE name = 'Green Earth Initiative'),
    (SELECT id FROM venues WHERE name = 'Seminar Room A, KTR'),
    'Zero Waste Workshop', '2026-10-05 10:00:00',
    'Workshop on sustainable living, composting and zero-waste practices for campus life.',
    400.00, 'pending',
    NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'
WHERE NOT EXISTS (SELECT 1 FROM event_proposals WHERE event_name = 'Zero Waste Workshop');

INSERT INTO events (proposal_id, club_id, venue_id, name, description, event_date, status, volunteering_status, created_at)
SELECT p.id, p.club_id, p.venue_id, p.event_name, p.description, p.proposed_date, 'completed', 'closed', NOW() - INTERVAL '24 days'
FROM event_proposals p
WHERE p.event_name = 'Campus Clean-Up Drive'
AND NOT EXISTS (SELECT 1 FROM events WHERE name = 'Campus Clean-Up Drive');

-- ── 15. Volunteering roles for open events ───────────────────
-- Uses events.id (NOT proposal_id) as required by volunteering_roles.event_id

-- Tech Symposium 2026 (approved, open)
INSERT INTO volunteering_roles (event_id, role_name, description, slots_available, slots_filled, created_at)
SELECT e.id, 'Registration Desk', 'Manage attendee check-in and badge distribution.', 4, 0, NOW()
FROM events e WHERE e.name = 'Tech Symposium 2026'
AND NOT EXISTS (SELECT 1 FROM volunteering_roles WHERE event_id = e.id AND role_name = 'Registration Desk');

INSERT INTO volunteering_roles (event_id, role_name, description, slots_available, slots_filled, created_at)
SELECT e.id, 'Tech Support', 'Assist with AV equipment and technical setup.', 2, 0, NOW()
FROM events e WHERE e.name = 'Tech Symposium 2026'
AND NOT EXISTS (SELECT 1 FROM volunteering_roles WHERE event_id = e.id AND role_name = 'Tech Support');

INSERT INTO volunteering_roles (event_id, role_name, description, slots_available, slots_filled, created_at)
SELECT e.id, 'Usher', 'Guide attendees to their seats and manage crowd flow.', 3, 0, NOW()
FROM events e WHERE e.name = 'Tech Symposium 2026'
AND NOT EXISTS (SELECT 1 FROM volunteering_roles WHERE event_id = e.id AND role_name = 'Usher');

-- Sports Carnival 2026 (approved, open)
INSERT INTO volunteering_roles (event_id, role_name, description, slots_available, slots_filled, created_at)
SELECT e.id, 'Registration Desk', 'Handle participant sign-ins and distribute bibs.', 5, 0, NOW()
FROM events e WHERE e.name = 'Sports Carnival 2026'
AND NOT EXISTS (SELECT 1 FROM volunteering_roles WHERE event_id = e.id AND role_name = 'Registration Desk');

INSERT INTO volunteering_roles (event_id, role_name, description, slots_available, slots_filled, created_at)
SELECT e.id, 'Event Crew', 'Set up and dismantle equipment at each station.', 6, 0, NOW()
FROM events e WHERE e.name = 'Sports Carnival 2026'
AND NOT EXISTS (SELECT 1 FROM volunteering_roles WHERE event_id = e.id AND role_name = 'Event Crew');

-- KTR CTF 2026 Season Opener (approved, open)
INSERT INTO volunteering_roles (event_id, role_name, description, slots_available, slots_filled, created_at)
SELECT e.id, 'Registration Desk', 'Check in participants and distribute challenge booklets.', 3, 0, NOW()
FROM events e WHERE e.name = 'KTR CTF 2026 Season Opener'
AND NOT EXISTS (SELECT 1 FROM volunteering_roles WHERE event_id = e.id AND role_name = 'Registration Desk');

INSERT INTO volunteering_roles (event_id, role_name, description, slots_available, slots_filled, created_at)
SELECT e.id, 'Tech Support', 'Monitor lab machines and assist participants with connectivity issues.', 2, 0, NOW()
FROM events e WHERE e.name = 'KTR CTF 2026 Season Opener'
AND NOT EXISTS (SELECT 1 FROM volunteering_roles WHERE event_id = e.id AND role_name = 'Tech Support');

-- ── Done ─────────────────────────────────────────────────────
-- All passwords: Password123!
--
-- ADMIN
--   admin.ktr@graduate.utm.my              → admin
--
-- LEADS
--   sarah.lead@graduate.utm.my             → lead  (Tech Club)
--   haziq.lead@graduate.utm.my             → lead  (Culture Club)
--   nurul.lead@graduate.utm.my             → lead  (Sports Community)
--   adam.lee@graduate.utm.my               → lead  (Cybersecurity KTR + Photography Society) ← multi-club
--   nadia.hassan@graduate.utm.my           → lead  (Green Earth Initiative)
--
-- MEMBERS
--   ahmad.faiz@graduate.utm.my             → member (Tech Club + Cybersecurity KTR) ← multi-club
--   siti.nurhaliza@graduate.utm.my         → member (Culture Club)
--   khairul.aizat@graduate.utm.my          → member (Sports Community)
--   chen.wei@graduate.utm.my               → member (Cybersecurity KTR + Photography Society) ← multi-club
--   priya.nair@graduate.utm.my             → member (Cybersecurity KTR)
--   marcus.tan@graduate.utm.my             → member (Cybersecurity KTR)
--   liyana.zulkifli@graduate.utm.my        → member (Green Earth Initiative)
--   kevin.wong@graduate.utm.my             → member (Green Earth Initiative)
--
-- STUDENTS
--   izzatul.husna@graduate.utm.my          → student
--   nadia.zainudin@graduate.utm.my         → student
--   alif.zulkifli@graduate.utm.my          → student (pending club request: Mental Health Allies)
--   sarah.binti@graduate.utm.my            → student (pending club request: Entrepreneurship Hub)
--   chenweil.jr@graduate.utm.my            → student
--
-- CLUBS (6 approved + 3 existing = 9 total, 2 pending requests)
--   Tech Club          · Technology   · Dr. Siti Aminah
--   Culture Club       · Arts & Culture · Dr. Rosmah Binti Ariffin
--   Sports Community   · Sports & Fitness · En. Farid Azri
--   Cybersecurity KTR  · Technology   · Dr. Azlan Rashid   (4 objectives)
--   Green Earth Init.  · Environment  · Dr. Siti Rahimah   (4 objectives)
--   Photography Society · Arts & Media · —                 (4 objectives)
--
-- PENDING REQUESTS
--   Mental Health Allies  (community, Wellness)  — by Alif Zulkifli
--   Entrepreneurship Hub  (club, Business)        — by Sarah Binti Idris
