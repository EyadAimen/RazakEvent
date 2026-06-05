-- Run this once to add the new fields to lead_role_requests
ALTER TABLE lead_role_requests
  ADD COLUMN IF NOT EXISTS student_message    TEXT,
  ADD COLUMN IF NOT EXISTS supporting_doc_url VARCHAR;
