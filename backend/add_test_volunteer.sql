-- ============================================================
-- Add test volunteer to a completed event for certificate testing
-- Run this in pgAdmin / DBeaver / psql
-- ============================================================

-- Step 0: find which schema your tables live in
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_name IN ('events','volunteering_roles','volunteering_applications','users')
ORDER BY table_schema, table_name;


DO $$
DECLARE
    v_event_id      INT;
    v_event_name    TEXT;
    v_role_id       INT;
    v_student_id    UUID;
    v_student_name  TEXT;
    v_app_id        INT;
BEGIN

    -- 1. Pick the first completed event
    SELECT id, name INTO v_event_id, v_event_name
    FROM events
    WHERE status = 'completed'
    ORDER BY id
    LIMIT 1;

    IF v_event_id IS NULL THEN
        RAISE EXCEPTION 'No completed events found. Mark an event as completed first.';
    END IF;

    RAISE NOTICE 'Using event: % (id=%)', v_event_name, v_event_id;

    -- 2. Find or create a volunteering role for that event
    SELECT id INTO v_role_id
    FROM volunteering_roles
    WHERE event_id = v_event_id
    LIMIT 1;

    IF v_role_id IS NULL THEN
        INSERT INTO volunteering_roles (event_id, role_name, description, slots_available, slots_filled)
        VALUES (v_event_id, 'Registration', 'Handles attendee check-in', 5, 0)
        RETURNING id INTO v_role_id;

        RAISE NOTICE 'Created new role "Registration" (id=%)', v_role_id;
    ELSE
        RAISE NOTICE 'Using existing role id=%', v_role_id;
    END IF;

    -- 3. Pick the first student/member user
    SELECT id, full_name INTO v_student_id, v_student_name
    FROM users
    WHERE role IN ('student', 'member')
    ORDER BY created_at
    LIMIT 1;

    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'No student/member users found. Create a student account first.';
    END IF;

    RAISE NOTICE 'Using student: % (id=%)', v_student_name, v_student_id;

    -- 4. Insert accepted application (skip if already exists)
    IF NOT EXISTS (
        SELECT 1 FROM volunteering_applications
        WHERE student_id = v_student_id AND event_id = v_event_id
    ) THEN
        INSERT INTO volunteering_applications
            (student_id, role_id, event_id, status, applied_at)
        VALUES
            (v_student_id, v_role_id, v_event_id, 'accepted', NOW())
        RETURNING id INTO v_app_id;

        -- Keep slots_filled in sync
        UPDATE volunteering_roles SET slots_filled = slots_filled + 1 WHERE id = v_role_id;

        RAISE NOTICE 'Created accepted application id=% for % on event "%"',
            v_app_id, v_student_name, v_event_name;
    ELSE
        -- If it exists but was not accepted, upgrade it
        UPDATE volunteering_applications
        SET status = 'accepted', reviewed_at = NOW()
        WHERE student_id = v_student_id AND event_id = v_event_id
          AND status != 'accepted';

        RAISE NOTICE 'Student % already has an application — set to accepted.', v_student_name;
    END IF;

END $$;

-- ── Verify the result ────────────────────────────────────────────────────────
SELECT
    va.id            AS application_id,
    u.full_name      AS volunteer_name,
    u.staff_or_matric_id AS matric_id,
    vr.role_name,
    e.name           AS event_name,
    e.status         AS event_status,
    va.status        AS application_status
FROM volunteering_applications va
JOIN users                u  ON u.id  = va.student_id
JOIN volunteering_roles   vr ON vr.id = va.role_id
JOIN events               e  ON e.id  = va.event_id
WHERE e.status = 'completed'
ORDER BY va.id;
