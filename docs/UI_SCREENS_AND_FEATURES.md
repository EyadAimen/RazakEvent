# RazakEvent — UI/UX Screen Documentation
**Project:** RazakEvent Web-Based Event Management System  
**Client:** Kolej Tun Razak (KTR), Universiti Teknologi Malaysia (UTM)  
**Stack:** Next.js (Frontend) · Express.js (Backend)  
**Document Purpose:** UI/UX development reference — defines all screens, sub-screens, and their content/components  

---

## Table of Contents

1. [System Overview & Role Map](#1-system-overview--role-map)
2. [Shared / Public Screens](#2-shared--public-screens)
   - 2.1 [Login Page](#21-login-page)
   - 2.2 [Sign Up Page](#22-sign-up-page)
   - 2.3 [Unauthorized / 404 Page](#23-unauthorized--404-page)
3. [Student Screens](#3-student-screens)
   - 3.8 [Become a Club Lead](#38-become-a-club-lead)
4. [Club / Community Lead Screens](#4-club--community-lead-screens)
5. [Admin Screens](#5-admin-screens)
   - 5.8 [Club Requests — Review Queue](#58-club-requests--review-queue)
6. [Shared UI Components](#6-shared-ui-components)
7. [Navigation Structure Summary](#7-navigation-structure-summary)

---

## 1. System Overview & Role Map

### User Roles
| Role | Who They Are | Key Permissions |
|---|---|---|
| **Student** | Any KTR resident student | View events, apply to volunteer, receive certificates |
| **Club / Community Lead** | Assigned by Admin; heads a club or community | Propose events, open volunteering, issue certificates, submit post-event reports |
| **Admin** | KTR administrative staff | Approve/decline event proposals, manage user roles |

> **Note (from meeting minutes):** Communities are higher priority than Clubs internally, but both follow the same event submission procedure with different form templates. The Admin can promote any student account to Club Lead or Community Lead.

---

## 2. Shared / Public Screens

### 2.1 Login Page
**Route:** `/login`  
**Accessible by:** All users (unauthenticated)

**Screen Content:**
- University/KTR branding (UTM logo + KTR logo)
- App name: **RazakEvent**
- Short tagline / description
- Email input field
- Password input field
- "Sign In" button
- Forgot password link

**Behaviour:**
- On successful login, redirect based on role:
  - Student → Student Dashboard
  - Club/Community Lead → Lead Dashboard
  - Admin → Admin Dashboard
- Display error message on invalid credentials

---

### 2.2 Sign Up Page
**Route:** `/signup`  
**Accessible by:** All users (unauthenticated)

**Screen Content:**
- University/KTR branding (UTM logo + KTR logo)
- App name: **RazakEvent**
- Page title: "Create Your Account"
- **Personal Information section:**
  - Full name (text input, required)
  - Matric number (text input, required)
  - Email address (text input, required — validated for UTM email format)
  - Password (password input, required — minimum 8 characters)
  - Confirm password (password input, required — must match password)
- **Role Selection section:**
  - Label: "Select your role"
  - Role selector (radio buttons or segmented control): `Student` / `Member` / `Lead`
  - Helper text beneath each option:
    - **Student:** "Browse events, volunteer, and earn certificates."
    - **Member:** "Join a club or community as a member."
    - **Lead:** "Manage events and volunteers for your club or community."
- **Club / Community Selection section** (conditional — shown only when **Member** or **Lead** is selected):
  - Label: "Select your Club / Community"
  - Searchable dropdown / list of all existing clubs and communities
  - Each option shows: Club/Community name, type badge (`Club` / `Community`)
  - Required when visible
  - Helper text: "You will be associated with this club/community upon admin approval."
- "Sign Up" button
- "Already have an account? Sign In" link (navigates to `/login`)

**Validation Rules:**
- All personal information fields are required
- Email must be a valid UTM email address
- Password and Confirm password must match
- If role is Member or Lead, a club/community must be selected

**Behaviour:**
- On successful submission:
  - If role is **Student:** Account is created and active immediately. Redirect to Student Dashboard.
  - If role is **Member:** Account is created. A membership request is sent to the selected club/community's Lead for approval. Redirect to Student Dashboard with a notice: "Your membership request for [Club Name] has been submitted and is pending approval by the club lead."
  - If role is **Lead:** Account is created. A lead role request is sent to the Admin for approval. Redirect to Student Dashboard with a notice: "Your request to become the lead of [Club Name] has been submitted to the Admin for approval."
- Display inline validation errors for invalid/missing fields
- Display error message if email is already registered

---

### 2.3 Unauthorized / 404 Page
**Routes:** `/unauthorized`, `/404`  
**Accessible by:** All users

**Screen Content:**
- Error code (403 / 404)
- Brief message
- "Go back to Home" button

---

## 3. Student Screens

### 3.1 Student Dashboard (Home)
**Route:** `/student/dashboard`  
**Accessible by:** Student, Club/Community Lead (shared base layout)

**Screen Content:**
- Welcome banner with student name
- **Upcoming Events section**
  - Event cards showing: Event name, date, venue, status badge (e.g. Approved, Upcoming)
  - "View Details" button on each card
  - Filter/sort controls: by date, by type (Club / Community) or name of the club / community
- **Quick Links section**
  - My Volunteering Applications
  - My Certificates
  - Event Calendar
- **Announcements / Notice strip** (for admin-pushed notices) (optional)

---

### 3.2 Event Calendar
**Route:** `/student/calendar`  
**Accessible by:** Student, Club/Community Lead

**Screen Content:**
- Full calendar view (monthly/weekly toggle)
- Each approved event displayed on its date as a chip/dot
- Clicking a date shows events for that day in a side panel or popup
- Each event chip shows: Event name, venue, time
- **Venue quick-reference** (drawn from: `https://dvcdev.utm.my/hospitality/kolej-tun-razak-ktr/`)
- Filter by: All Events / My Volunteering Events (Upcoming only)

**modal/alert (on event click):**
- Event name
- Date & time
- Venue
- Organizing club/community
- Short description
- "View Full Details" button

---

### 3.3 Event Detail Page
**Route:** `/student/events/:eventId`  
**Accessible by:** Student, Club/Community Lead

**Screen Content:**
- Event name (header)
- Status badge: `Approved` / `Ongoing` / `Completed` - visible for the leads only,
- Date, time, and venue
- Organizing club/community name
- Event description
- **Volunteering section** (conditional — only shown if event has open volunteering):
  - Number of volunteer slots available
  - "Apply to Volunteer" button (disabled if already applied or slots full)
  - Application status if already applied: `Pending` / `Accepted` / `Rejected`
- Back button / breadcrumb

---

### 3.4 Volunteering Application Screen
**Route:** `/student/events/:eventId/volunteer`  
**Accessible by:** Student

**Screen Content:**
- Event name (read-only summary)
- Volunteering role description (if provided by Lead)
- Confirmation statement / acknowledgement checkbox
- "Submit Application" button
- "Cancel" button

**Post-submission:**
- Success message: "Your application has been submitted. The club/community lead will review it." - in a modal / alert
- Redirect back to Event Detail Page

---

### 3.5 My Volunteering Applications
**Route:** `/student/volunteering`  
**Accessible by:** Student

**Screen Content:**
- List of all volunteering applications made by the student
- Each item shows:
  - Event name
  - Event date
  - Application status badge: `Pending` / `Accepted` / `Rejected`
  - "View Event" link
- Empty state: "You have not applied to volunteer for any events yet."

---

### 3.6 My Certificates
**Route:** `/student/certificates`  
**Accessible by:** Student

**Screen Content:**
- List of certificates earned from completed volunteering/organizing
- Each certificate card shows:
  - Event name
  - Role (Volunteer / Organizer)
  - Date of event
  - "Download Certificate" button (PDF)
- Empty state: "No certificates yet. Participate in events to earn one."

---

### 3.7 Student Profile
**Route:** `/student/profile`  
**Accessible by:** Student

**Screen Content:**
- Profile photo (avatar/initials fallback)
- Full name
- Matric number
- Email
- Role badge: `Student` / `Club Lead` / `Community Lead`
- **Volunteering History section:**
  - Table/list of all past volunteering activities
  - Columns: Event Name | Date | Role | Status
- Edit profile button (name/photo only; email/role are system-managed)

---

### 3.8 Become a Club Lead
**Route:** `/student/become-lead`  
**Accessible by:** Student

**Screen Content:**
- Page title: "Become a Club / Community Lead"
- Brief description: "Select an existing club or community to request the Lead role. If your club doesn't exist yet, you can submit a request to create one."
- **Club / Community Selection section:**
  - Searchable dropdown / list of all existing clubs and communities
  - Each option shows: Club/Community name, type badge (`Club` / `Community`)
  - "Request Lead Role" button (enabled once a club/community is selected)
- **Add New Club / Community section** (collapsible, shown below the dropdown):
  - Section header: "Can't find your club? Request a new one"
  - Club / Community name input (text field, required)
  - Type selector: `Club` / `Community` (radio or dropdown, required)
  - Description textarea (required, max 500 characters) — brief overview of the club's purpose/activities
  - "Submit Club Request" button
  - Helper text: "New clubs must be reviewed and approved by the KTR Admin before you can be assigned as Lead."

**Behaviour — Existing Club selected:**
- On "Request Lead Role" click → confirmation dialog → submit request
- Success message (modal/alert): "Your request to become the lead of [Club Name] has been sent to the Admin for approval."
- Request appears in Admin's User Management queue
- Redirect back to Student Dashboard

**Behaviour — New Club submitted:**
- On "Submit Club Request" click → validation → confirmation dialog → submit
- Success message (modal/alert): "Your club request has been submitted. The KTR Admin will review it. Once approved, you will be assigned as Lead."
- Request appears in Admin's Club Requests review queue (see 5.8)
- Redirect back to Student Dashboard

---

## 4. Club / Community Lead Screens

> Club Lead and Community Lead share the same screens. Differences are only in the form templates used when submitting events (handled at the backend/form-template level).

### 4.1 Lead Dashboard (Home)
**Route:** `/lead/dashboard`  
**Accessible by:** Club Lead, Community Lead

**Screen Content:**
- Welcome banner with lead's name and club/community label
- **My Events section:**
  - Cards for each proposed/active event
  - Status badge on each: `Draft` / `Submitted` / `Approved` / `Rejected` / `Completed` / `Report Due` - this is when completing the event
  - "View Details" 
- **Alerts / Reminders section:**
  - Events with reports due within 14 days (highlighted in amber/red) 
  - Events pending admin action
- **Quick Actions:**
  - "Propose New Event" button
  - "View Volunteering Applications" button
  - "My Certificates Issued" button

---

### 4.2 Propose Event Screen
**Route:** `/lead/events/new`  
**Accessible by:** Club Lead, Community Lead

**Screen Content:**
- Screen title: "Submit Event Proposal"
- **Event Basic Info section:**
  - Event name (text input)
  - Event type selector: `Club Event` / `Community Event` (auto-set based on lead's role)
  - Proposed date & time (date-time picker)
  - Proposed venue (dropdown pulled from KTR venues list)
  - Short description (textarea)
- **Form Upload section:**
  - Instruction text: "Download the official event proposal template, fill it out, and upload the completed PDF below."
  - "Download Template" button (links to provided template)
  - PDF file upload input (drag-and-drop + file browser)
  - File validation: PDF only, max size indicator
- **Budget section:**
  - Estimated budget amount (number input) - for easy access for admin (in will be included in the submitted form)
  - Note: "Funds will be released upon approval. Submit money report within 14 days after the event."
- Submit button: "Submit Proposal"
- Save as Draft button
- Cancel / Back button

**Post-submission:**
- Success message: "Your event proposal has been submitted to the KTR Admin for review." - in modal / alert
- Redirect to My Events list

---

### 4.3 My Events List
**Route:** `/lead/events`  
**Accessible by:** Club Lead, Community Lead

**Screen Content:**
- Page title: "My Events"
- Filter tabs: `All` | `Pending` | `Approved` | `Rejected` | `Completed` | `Report Due`
- Event table/cards showing:
  - Event name
  - Submission date
  - Event date
  - Venue
  - Status badge
  - Actions: `View` / `Submit Report` / `Manage Volunteers`
- "Propose New Event" button (top right)

---

### 4.4 Event Detail — Lead View
**Route:** `/lead/events/:eventId`  
**Accessible by:** Club Lead, Community Lead

**Screen Content:**
- Event name (header)
- Status badge
- Submitted proposal PDF (view/download link)
- Event date, time, venue
- Budget amount
- Admin review status and notes (if admin left a comment on rejection)
- **Volunteering section** (conditional — only if event is Approved):
  - Toggle: "Open Volunteering for this Event" (on/off)
  - If on: number of slots input, role/task description textarea - create roles and for each role get from number of slots
  - "Save Volunteering Settings" button
- **Volunteer Applications sub-section** (if volunteering is open):
  - Table of applicants: Name | Student ID | Application Date | Status
  - Action per applicant: `Accept` / `Reject`
- **Post-Event section** (visible if event status is `Completed` or `Report Due`):
  - Report submission countdown: "X days remaining to submit reports"
  - "Submit Event Report" button
  - "Submit Money Report" button
  - Certificate management (see 4.5)

---

### 4.5 Submit Post-Event Reports
**Route:** `/lead/events/:eventId/reports`  
**Accessible by:** Club Lead, Community Lead  
**Constraint:** Must be submitted within **14 days** of event completion

**Sub-screen: Event Report Submission**
- Instruction text + "Download Event Report Template" button
- PDF file upload for Event Report
- "Submit Event Report" button

**Sub-screen: Money Report Submission**
- Instruction text + "Download Money Report Template" button
- PDF file upload for Money Report
- Total amount spent (number input, for record)
- "Submit Money Report" button

**Shared elements:**
- Deadline countdown banner (amber if <7 days, red if <3 days)
- Status indicators: `Not Submitted` / `Submitted` / `accepted by Admin`

---

### 4.6 Manage Certificates
**Route:** `/lead/events/:eventId/certificates`  
**Accessible by:** Club Lead, Community Lead  
**Condition:** Event must be in `Completed` status

**Screen Content:**
- Page title: "Issue Certificates — [Event Name]"
- **Organizer Certificates section:**
  - Auto-generated list of club/community members involved
  - Checkbox to select/deselect each member for certificate issuance
  - "Generate Certificates for Selected" button
- **Volunteer Certificates section:**
  - List of accepted volunteers who participated
  - Checkbox selection per volunteer
  - "Generate Certificates for Selected" button
- Individual certificate preview (modal) before generation
- Download All button (bulk ZIP download)

---

### 4.7 Lead Profile
**Route:** `/lead/profile`  
**Accessible by:** Club Lead, Community Lead

**Screen Content:**
- Same as Student Profile (3.7)
- Additional: Club/Community name and type shown prominently

### 4.8 Lead club / community page
**Route:** `/lead/club`  
**Accessible by:** Club Lead, Community Lead
**Screen Content:**
- Contains name of the club/event
- Manage members roles
- accept user request by members
- list of members
- Additional: Club/Community name and type shown prominently
- List of all events ever proposed (summary stats: total, approved, rejected, completed)

---

## 5. Admin Screens

### 5.1 Admin Dashboard (Home)
**Route:** `/admin/dashboard`  
**Accessible by:** Admin

**Screen Content:**
- Welcome banner
- **Summary Stats row (cards):**
  - Total Events (this semester)
  - Pending Approvals
  - Approved Events
  - Rejected Events
  - Reports Overdue
- **Pending Approvals section:**
  - List of event proposals awaiting review
  - Each row: Event name | Submitted by | Submission date | "Review" button
  - Sorted by: oldest first (to prevent delays)
- **Recent Activity feed** (right sidebar or bottom):
  - Latest submissions, approvals, report submissions
- **Overdue Reports section:**
  - Events past 14-day report window with no submission
  - Club/Community name | Event name | Days overdue

---

### 5.2 Event Proposals — Review Queue
**Route:** `/admin/proposals`  
**Accessible by:** Admin

**Screen Content:**
- Page title: "Event Proposal Review"
- Filter/search bar: by status, club/community name, date range
- Table of proposals:
  - Event name
  - Submitting Lead (name + club/community)
  - Proposed Date
  - Venue
  - Submission Date
  - Status: `Pending` / `Approved` / `Rejected`
  - Action: "Review"

---

### 5.3 Event Proposal — Detail & Decision
**Route:** `/admin/proposals/:proposalId`  
**Accessible by:** Admin

**Screen Content:**
- Event name (header)
- Submitted by: Lead name, Club/Community name
- Type: Community or Club
- Proposed date, time, venue
- Estimated budget
- **Submitted PDF viewer** (inline PDF preview + download button)
- **Decision section:**
  - Approve button (green)
  - Reject button (red)
  - Comments / feedback textarea (required on rejection, optional on approval)
  - "Confirm Decision" button
- Status banner at top if already decided (with timestamp and previous admin comment)

**Post-decision behaviour:**
- Status updates immediately
- Lead is notified (on their dashboard) of the decision
- If Approved: event becomes visible to students on calendar
- If Rejected: event stays in lead's list with admin comment visible

---

### 5.4 All Events Overview
**Route:** `/admin/events`  
**Accessible by:** Admin

**Screen Content:**
- Page title: "All Events"
- Filter tabs: `All` | `Upcoming` | `Ongoing` | `Completed` | `Rejected`
- Search by event name or submitting club
- Event table:
  - Event name
  - Club / Community
  - Date
  - Venue
  - Status badge
  - "View Details" link

---

### 5.5 Event Detail — Admin View
**Route:** `/admin/events/:eventId`  
**Accessible by:** Admin

**Screen Content:**
- Full event info (same as lead view, read-only for admin)
- Proposal PDF (view/download)
- Volunteering status (open/closed, number of volunteers)
- **Post-Event Reports section:**
  - Event Report: `Not Submitted` / `Submitted` (view PDF)
  - Money Report: `Not Submitted` / `Submitted` (view PDF)
  - Submission date timestamps
- Admin notes field (for internal reference)

---

### 5.6 User Management
**Route:** `/admin/users`  
**Accessible by:** Admin

**Screen Content:**
- Page title: "User Management"
- Search bar (by name, student ID, email)
- User table:
  - Name
  - Student ID
  - Email
  - Current Role badge: `Student` / `Club Lead` / `Community Lead` / `Club/Community Member`
  - "Edit Role" button
- Filter by role
- Search by name

**Sub-screen: Edit User Role (Modal or inline)**
- User's name and current role (read-only)
- Role selector dropdown: `Student` / `Club Lead` / `Community Lead`
- Club/Community name input (shown if Lead is selected — which club/community they head)
- "Save Changes" button
- "Cancel" button

---

### 5.7 Admin Profile
**Route:** `/admin/profile`  
**Accessible by:** Admin

**Screen Content:**
- Name, email, role: "KTR Administrator"
- Password change option
- Activity log (recent decisions made)

---

### 5.8 Club Requests — Review Queue
**Route:** `/admin/club-requests`  
**Accessible by:** Admin

**Screen Content:**
- Page title: "Club / Community Requests"
- Filter tabs: `Pending` | `Approved` | `Rejected` | `All`
- Search bar: by club name or requesting student name
- Request table/cards showing:
  - Club / Community name
  - Type badge: `Club` / `Community`
  - Description (truncated, expandable on click)
  - Requested by: Student name + Student ID
  - Submission date
  - Status badge: `Pending` / `Approved` / `Rejected`
  - "Review" button
- Empty state: "No pending club requests."

**Sub-screen: Club Request Detail (Modal or dedicated page)**
**Route:** `/admin/club-requests/:requestId`
- Club / Community name (header)
- Type: `Club` / `Community`
- Full description
- Requested by: Student name, Student ID, email
- Submission date
- **Decision section:**
  - Approve button (green) — creates the club and assigns the requesting student as Lead
  - Reject button (red)
  - Admin comments / feedback textarea (required on rejection, optional on approval)
  - "Confirm Decision" button
- Status banner at top if already reviewed (with timestamp and admin comment)

**Post-decision behaviour:**
- **If Approved:**
  - Club/Community is created in the system
  - Requesting student's role is upgraded to Club Lead / Community Lead
  - Student is notified via dashboard notification
- **If Rejected:**
  - Student is notified with admin's feedback
  - Student can re-submit with modifications from the same screen (3.8)

---

## 6. Shared UI Components

These components appear across multiple screens and roles:


(might not fit the web app theme)
### 6.1 Top Navigation Bar
- App logo / name: "RazakEvent"
- Role-appropriate nav links (different per role)
- Notification bell icon (with unread count badge)
- User avatar/initials → dropdown: Profile, Logout


(might not fit the web app theme)
### 6.2 Sidebar (Desktop)
- Role-based navigation links
- Collapsible on mobile


(to be decided when designing the screens)
### 6.3 Event Status Badge
Consistent colour-coded badge used everywhere:
| Status | Colour |
|---|---|
| Draft | Grey |
| Submitted / Pending | Yellow / Amber |
| Approved | Green |
| Rejected | Red |
| Ongoing | Blue |
| Completed | Teal / Indigo |
| Report Due | Orange |
| Overdue | Dark Red |


(based on what you see it but not necessarly to implement)
### 6.4 Notification System
- In-app notification panel (bell icon)
- Triggered events:
  - Admin approves/rejects a proposal → Lead notified
  - Volunteering application accepted/rejected → Student notified
  - 14-day report deadline approaching (7 days, 3 days, 1 day) → Lead notified
  - New event proposal submitted → Admin notified
  - Certificate issued → Student notified

### 6.5 PDF Upload Component
- Drag-and-drop zone with file icon
- File browser fallback button
- File type validation: PDF only
- File size indicator
- Upload progress bar
- Preview button (opens PDF in modal)
- Remove/replace file option

### 6.6 Certificate Preview Modal
- Certificate template preview with:
  - KTR/UTM logo
  - Recipient name
  - Event name
  - Role (Organizer / Volunteer)
  - Date of event
  - Signature line placeholder
- "Download PDF" button
- "Close" button

### 6.7 Confirmation Dialog
- Used for: submit proposal, approve/reject event, generate certificates, role change
- Title, body message, "Confirm" (primary) and "Cancel" (secondary) buttons

### 6.8 Empty State Component
- Illustration or icon
- Title message
- Subtext
- Call-to-action button (where applicable)

---

### 6.9 Alert / Modal
- Alert / modal container
- Create the container with the background dim and everything
---

## 7. Navigation Structure Summary

```
/login                                      ← Shared
/signup                                     ← Shared (Sign Up)

/student/
  dashboard                                 ← Home
  calendar                                  ← Event calendar
  events/:eventId                           ← Event detail
  events/:eventId/volunteer                 ← Volunteer application
  volunteering                              ← My applications
  certificates                              ← My certificates
  become-lead                               ← Become a club lead
  profile                                   ← Profile

/lead/
  dashboard                                 ← Home
  events                                    ← My events list
  events/new                                ← Propose new event
  events/:eventId                           ← Event detail (lead view)
  events/:eventId/reports                   ← Submit post-event reports
  events/:eventId/certificates              ← Issue certificates
  profile                                   ← Profile

/admin/
  dashboard                                 ← Home
  proposals                                 ← Review queue
  proposals/:proposalId                     ← Proposal detail & decision
  events                                    ← All events overview
  events/:eventId                           ← Event detail (admin view)
  users                                     ← User management
  club-requests                             ← Club requests review queue
  club-requests/:requestId                  ← Club request detail & decision
  profile                                   ← Profile
```

---

## 8. Feature-to-Screen Cross-Reference

| Feature (from SPP) | Primary Screens |
|---|---|
| Event Submission Management | Lead: Propose Event, My Events List |
| Event Approval Workflow | Admin: Proposal Queue, Proposal Detail |
| Document Management System | Lead: Propose Event (PDF upload), Submit Reports; Admin: Proposal Detail, Event Detail |
| Event Tracking System | Lead: My Events (status badges); Admin: All Events; Student: Event Calendar |
| Event Volunteering | Student: Event Detail, Volunteer Application, My Applications; Lead: Event Detail (manage volunteers) |
| Certificate Generation | Lead: Manage Certificates; Student: My Certificates |
| User Role Management | Admin: User Management |
| Club / Community Creation & Lead Requests | Student: Become a Club Lead; Admin: Club Requests Review Queue |
| Post-Event Reporting | Lead: Submit Reports; Admin: Event Detail (admin view) |

---


*Group 06 · SCSJ3104 Application Development · UTM*
