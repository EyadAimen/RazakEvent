# RazakEvent — Database Design Documentation


## Table of Contents

1. [Entities](#1-entities)
2. [Relationships](#2-relationships)
3. [Attributes & Constraints](#3-attributes--constraints)
4. [Design Decisions Log](#4-design-decisions-log)

---

## 1. Entities

* User [ Student, Member, Lead, Admin ]
* Club [ Club/ Community ]
* Event
* Club Request
* Lead Role Request
* Membership Request
* Certificate [ Organizer, Volunteer ]
* Volunteering Application
* Volunteering Role
* Event Proposal
* Event Report
* Money Report
* Venue

---

## 2. Relationships

| Entity | Multiplicity | Relationship | Multiplicity | Entity | Note |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **— Student —** | | | | | |
| Student | 0..* | Member of | 0..* | Club/ Community | |
| Student | 0..1 | Leader of | 1..1 | Club/ Community | |
| Student | 0..* | Submit | 1..1 | Volunteering Application | |
| Student | 0..* | Receive | 1..1 | Certificate | Volunteer certificates only |
| Student | 0..* | Submit | 1..1 | Membership Request | |
| Student | 0..* | Submit | 1..1 | Lead Role Request | Request to lead an existing club |
| Student | 0..* | Submit | 1..1 | Club Request | Request to create a new club |
| **— Member —** | | | | | |
| Member | 0..* | Receive | 1..1 | Certificate | Organizer certificates only |
| **— Lead —** | | | | | |
| Lead | 0..* | Submit | 1..1 | Event Proposal | Accountability — who submitted |
| Lead | 0..* | Generate | 1..1 | Event Report | Accountability — who submitted |
| Lead | 0..* | Generate | 1..1 | Money Report | Accountability — who submitted |
| Lead | 0..* | Manage | 1..1 | Volunteering Application | Accept / Reject applicants |
| Lead | 0..* | Manage | 1..1 | Membership Request | Accept / Reject member requests |
| **— Admin —** | | | | | |
| Admin | 0..* | Manage | 1..1 | Event Proposal | Approve / Reject |
| Admin | 0..* | Manage | 1..1 | Club Request | Approve / Reject |
| Admin | 0..* | Manage | 1..1 | Lead Role Request | Approve / Reject |
| Admin | 0..* | Review | 1..1 | Event Report | |
| Admin | 0..* | Review | 1..1 | Money Report | |
| **— Club/ Community —** | | | | | |
| Club/ Community | 0..* | Organize | 1..1 | Event | |
| Club/ Community | 0..* | Own | 1..1 | Event Proposal | Ownership — which club the proposal belongs to |
| Club/ Community | 0..* | Own | 1..1 | Event Report | Ownership — persists even if lead changes |
| Club/ Community | 0..* | Own | 1..1 | Money Report | Ownership — persists even if lead changes |
| Club/ Community | 1..1 | Receives | 0..* | Membership Request | |
| Club/ Community | 1..1 | Receives | 0..* | Lead Role Request | |
| **— Event —** | | | | | |
| Event | 1..1 | Hosted in | 0..* | Venue | |
| Event | 1..1 | Has | 0..* | Volunteering Role | Roles created per event by lead |
| Event | 1..1 | Generates | 0..* | Certificate | |
| Event | 1..1 | Has | 0..1 | Event Report | At most one per event |
| Event | 1..1 | Has | 0..1 | Money Report | At most one per event |
| **— Event Proposal —** | | | | | |
| Event Proposal | 0..1 | Results in | 1..1 | Event | Only if approved |
| **— Club Request —** | | | | | |
| Club Request | 0..1 | Results in | 1..1 | Club/ Community | Only if approved |
| **— Volunteering Role —** | | | | | |
| Volunteering Role | 1..1 | Receives | 0..* | Volunteering Application | Applications tied to a role, not just an event |

---

## 3. Attributes & Constraints

### 3.1 users
| Attribute | Type | Constraint |
| :--- | :--- | :--- |
| id | INT | PK, Auto Increment |
| full_name | VARCHAR | NOT NULL |
| staff_or_matric_id | VARCHAR | NULLABLE, UNIQUE when not NULL |
| email | VARCHAR | NOT NULL, UNIQUE |
| password_hash | VARCHAR | NOT NULL |
| role | ENUM | NOT NULL ['student', 'member', 'lead', 'admin'] |
| profile_photo_url | VARCHAR | NULLABLE |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

---

### 3.2 clubs
| Attribute | Type | Constraint |
| :--- | :--- | :--- |
| id | INT | PK, Auto Increment |
| name | VARCHAR | NOT NULL, UNIQUE |
| type | ENUM | NOT NULL ['club', 'community'] |
| description | TEXT | NOT NULL |
| lead_id | INT | NULLABLE, FK → users.id |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

---

### 3.3 venues
| Attribute | Type | Constraint |
| :--- | :--- | :--- |
| id | INT | PK, Auto Increment |
| name | VARCHAR | NOT NULL, UNIQUE |
| location | VARCHAR | NULLABLE |

---

### 3.4 event_proposals
| Attribute | Type | Constraint |
| :--- | :--- | :--- |
| id | INT | PK, Auto Increment |
| lead_id | INT | NOT NULL, FK → users.id |
| club_id | INT | NOT NULL, FK → clubs.id |
| admin_id | INT | NULLABLE, FK → users.id |
| venue_id | INT | NULLABLE, FK → venues.id |
| event_name | VARCHAR | NOT NULL |
| proposed_date | TIMESTAMP | NULLABLE |
| description | TEXT | NULLABLE |
| estimated_budget | DECIMAL | NULLABLE |
| proposal_pdf_url | VARCHAR | NULLABLE |
| status | ENUM | NOT NULL ['draft', 'pending', 'approved', 'rejected'] |
| admin_comment | TEXT | NULLABLE |
| submitted_at | TIMESTAMPTZ | NULLABLE |
| reviewed_at | TIMESTAMPTZ | NULLABLE |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

**Note:** `venue_id`, `proposed_date`, `description`, `estimated_budget`, `proposal_pdf_url`, and `submitted_at` are NULLABLE to accommodate incomplete drafts. They become required at the application layer upon submission.

---

### 3.5 events
| Attribute | Type | Constraint |
| :--- | :--- | :--- |
| id | INT | PK, Auto Increment |
| proposal_id | INT | NOT NULL, FK → event_proposals.id |
| club_id | INT | NOT NULL, FK → clubs.id |
| venue_id | INT | NOT NULL, FK → venues.id |
| name | VARCHAR | NOT NULL |
| description | TEXT | NOT NULL |
| event_date | TIMESTAMP | NOT NULL |
| status | ENUM | NOT NULL ['approved', 'ongoing', 'completed', 'report_due'] |
| volunteering_status | ENUM | NOT NULL ['closed', 'open', 'full'], DEFAULT 'closed' |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

---

### 3.6 volunteering_roles
| Attribute | Type | Constraint |
| :--- | :--- | :--- |
| id | INT | PK, Auto Increment |
| event_id | INT | NOT NULL, FK → events.id |
| role_name | VARCHAR | NOT NULL |
| description | TEXT | NULLABLE |
| slots_available | INT | NOT NULL |
| slots_filled | INT | NOT NULL, DEFAULT 0 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

---

### 3.7 volunteering_applications
| Attribute | Type | Constraint |
| :--- | :--- | :--- |
| id | INT | PK, Auto Increment |
| student_id | INT | NOT NULL, FK → users.id |
| role_id | INT | NOT NULL, FK → volunteering_roles.id |
| status | ENUM | NOT NULL ['pending', 'accepted', 'rejected'], DEFAULT 'pending' |
| applied_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |
| reviewed_at | TIMESTAMPTZ | NULLABLE |

**Additional Constraints:**
- **Unique Constraint:** `(student_id, role_id)` — A student can only apply once per role.

---

### 3.8 club_members
| Attribute | Type | Constraint |
| :--- | :--- | :--- |
| user_id | INT | NOT NULL, FK → users.id |
| club_id | INT | NOT NULL, FK → clubs.id |
| joined_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

**Additional Constraints:**
- **Primary Key:** `(user_id, club_id)`
- **Unique Constraint:** `user_id` — A member can only belong to one club.

---

### 3.9 certificates
| Attribute | Type | Constraint |
| :--- | :--- | :--- |
| id | INT | PK, Auto Increment |
| user_id | INT | NOT NULL, FK → users.id |
| event_id | INT | NOT NULL, FK → events.id |
| type | ENUM | NOT NULL ['organizer', 'volunteer'] |
| issued_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

**Additional Constraints:**
- **Unique Constraint:** `(user_id, event_id, type)` — No duplicate certificates.

---

### 3.10 event_reports
| Attribute | Type | Constraint |
| :--- | :--- | :--- |
| id | INT | PK, Auto Increment |
| event_id | INT | NOT NULL, UNIQUE, FK → events.id |
| lead_id | INT | NOT NULL, FK → users.id |
| club_id | INT | NOT NULL, FK → clubs.id |
| admin_id | INT | NULLABLE, FK → users.id |
| report_pdf_url | VARCHAR | NOT NULL |
| status | ENUM | NOT NULL ['submitted', 'reviewed'], DEFAULT 'submitted' |
| admin_comment | TEXT | NULLABLE |
| submitted_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |
| reviewed_at | TIMESTAMPTZ | NULLABLE |

---

### 3.11 money_reports
| Attribute | Type | Constraint |
| :--- | :--- | :--- |
| id | INT | PK, Auto Increment |
| event_id | INT | NOT NULL, UNIQUE, FK → events.id |
| lead_id | INT | NOT NULL, FK → users.id |
| club_id | INT | NOT NULL, FK → clubs.id |
| admin_id | INT | NULLABLE, FK → users.id |
| report_pdf_url | VARCHAR | NOT NULL |
| amount_spent | DECIMAL | NOT NULL |
| status | ENUM | NOT NULL ['submitted', 'reviewed'], DEFAULT 'submitted' |
| admin_comment | TEXT | NULLABLE |
| submitted_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |
| reviewed_at | TIMESTAMPTZ | NULLABLE |

---

### 3.12 club_requests
| Attribute | Type | Constraint |
| :--- | :--- | :--- |
| id | INT | PK, Auto Increment |
| student_id | INT | NOT NULL, FK → users.id |
| admin_id | INT | NULLABLE, FK → users.id |
| result_club_id | INT | NULLABLE, FK → clubs.id |
| club_name | VARCHAR | NOT NULL |
| club_type | ENUM | NOT NULL ['club', 'community'] |
| description | TEXT | NOT NULL |
| status | ENUM | NOT NULL ['pending', 'approved', 'rejected'] |
| admin_comment | TEXT | NULLABLE |
| submitted_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |
| reviewed_at | TIMESTAMPTZ | NULLABLE |

**Additional Constraints:**
- **Partial Unique Constraint:** `student_id` WHERE `status = 'pending'` — A student can only have one pending club request at a time.

---

### 3.13 lead_role_requests
| Attribute | Type | Constraint |
| :--- | :--- | :--- |
| id | INT | PK, Auto Increment |
| student_id | INT | NOT NULL, FK → users.id |
| club_id | INT | NOT NULL, FK → clubs.id |
| admin_id | INT | NULLABLE, FK → users.id |
| status | ENUM | NOT NULL ['pending', 'approved', 'rejected'] |
| admin_comment | TEXT | NULLABLE |
| submitted_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |
| reviewed_at | TIMESTAMPTZ | NULLABLE |

**Additional Constraints:**
- **Partial Unique Constraint:** `student_id` WHERE `status = 'pending'` — A student can only have one pending lead role request at a time.

---

### 3.14 membership_requests
| Attribute | Type | Constraint |
| :--- | :--- | :--- |
| id | INT | PK, Auto Increment |
| student_id | INT | NOT NULL, FK → users.id |
| club_id | INT | NOT NULL, FK → clubs.id |
| reviewed_by | INT | NULLABLE, FK → users.id |
| status | ENUM | NOT NULL ['pending', 'approved', 'rejected'] |
| submitted_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |
| reviewed_at | TIMESTAMPTZ | NULLABLE |

**Additional Constraints:**
- **Partial Unique Constraint:** `(student_id, club_id)` WHERE `status = 'pending'` — A student can only have one pending membership request per club at a time.

---

## 4. Design Decisions Log

| # | Entity | Decision | Reasoning |
| :--- | :--- | :--- | :--- |
| 1 | users | `staff_or_matric_id` is NULLABLE | Admins are staff, not students — they don't have matric numbers. Enforcing NOT NULL would break admin account creation. |
| 2 | users | Single `role` column for all user types | All roles share the same login and credentials. Role changes are handled by updating this column, not creating new records. |
| 3 | clubs | `lead_id` is NULLABLE | A club may temporarily have no lead (e.g. lead removed by admin, pending reassignment). Leaderless clubs are treated as inactive at the application layer. |
| 4 | clubs | Single table for Club and Community | Both types follow identical workflows and share all attributes. Distinguished by a `type` ENUM column. |
| 5 | event_proposals | Draft support via nullable fields | The UI has a "Save as Draft" button. Rather than a separate drafts table, `status = 'draft'` is added to the ENUM and completion-required fields are NULLABLE, enforced at the application layer on submission. |
| 6 | event_proposals & reports | Both `lead_id` and `club_id` stored | `lead_id` tracks accountability (who submitted). `club_id` tracks ownership (which club it belongs to). Ownership must persist even if the lead is later changed or removed. |
| 7 | events | Data copied from proposal | Events store their own copy of name, description, venue, and date rather than always joining back to `event_proposals`. Ensures event integrity and improves query performance. |
| 8 | events | `volunteering_status` as ENUM | Three states needed: `closed`, `open`, `full`. A boolean would not capture the `full` state, requiring an extra query to check slot availability on every page visit. |
| 9 | volunteering_roles | `slots_filled` counter column | Avoids a COUNT query on `volunteering_applications` every time a student views the event page. Incremented at the application layer when an application is accepted. |
| 10 | volunteering_applications | UNIQUE `(student_id, role_id)` | Prevents duplicate applications to the same role by the same student at the DB level. |
| 11 | club_members | UNIQUE `user_id` | A member can only belong to one club at a time, enforced at the DB level. |
| 12 | certificates | UNIQUE `(user_id, event_id, type)` | Prevents a lead from accidentally issuing duplicate certificates to the same person for the same event. |
| 13 | event_reports & money_reports | `status` ENUM ['submitted', 'reviewed'] | The UI shows no rejection flow for reports — admin can only review/acknowledge. `reviewed` is more semantically accurate than `accepted`. |
| 14 | club_requests | Partial UNIQUE on `student_id` WHERE `status = 'pending'` | Prevents spam submissions while still allowing resubmission after rejection. |
| 15 | lead_role_requests | Partial UNIQUE on `student_id` WHERE `status = 'pending'` | Same reasoning as club_requests. |
| 16 | membership_requests | Partial UNIQUE on `(student_id, club_id)` WHERE `status = 'pending'` | Prevents a student from sending duplicate membership requests to the same club while one is still pending. |
| 17 | PDF fields | Stored as URL/path strings | PDF files are never stored in the DB directly. Files are uploaded to storage (local folder or cloud), and only the resulting URL/path is stored as VARCHAR. |
| 18 | Timestamps | TIMESTAMPTZ used throughout | PostgreSQL best practice — timezone-aware timestamps prevent ambiguity across sessions and deployments. |
