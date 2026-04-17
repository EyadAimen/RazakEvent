# RazakEvent — Frontend Development Guidelines

This document outlines the architecture, setup, and development guidelines for the RazakEvent frontend. By centralising these guidelines here, we ensure a scalable and maintainable codebase as the project grows.

## 1. System Overview & Tech Stack

Our frontend is built using a modern, scalable web stack:
- **Framework:** Next.js 16 (App Router)
- **Library:** React 19
- **Language:** TypeScript
- **Styling:** CSS Modules / Global CSS
- **Code Quality:** ESLint

## 2. Directory Structure & Routing

This architecture leverages the Next.js App Router and a robust components directory grouping for UI reusability.

### Application Tree

```text
razakevent-frontend/
├── src/
│   ├── app/                              # Next.js App Router root
│   │   │
│   │   ├── (auth)/                       # Route group — no shared layout
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (dashboard)/                  # Route group — all roles share shell
│   │   │   ├── layout.tsx                # Shell: topnav + sidebar + notification
│   │   │   │
│   │   │   ├── student/
│   │   │   │   ├── layout.tsx            # Student-specific sidebar config
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── calendar/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── events/
│   │   │   │   │   └── [eventId]/
│   │   │   │   │       ├── page.tsx      # Event detail
│   │   │   │   │       └── volunteer/
│   │   │   │   │           └── page.tsx  # Volunteer application
│   │   │   │   ├── volunteering/
│   │   │   │   │   └── page.tsx          # My applications
│   │   │   │   ├── certificates/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── profile/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── lead/
│   │   │   │   ├── layout.tsx            # Lead-specific sidebar config
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── events/
│   │   │   │   │   ├── page.tsx          # My events list
│   │   │   │   │   ├── new/
│   │   │   │   │   │   └── page.tsx      # Propose event
│   │   │   │   │   └── [eventId]/
│   │   │   │   │       ├── page.tsx      # Event detail (lead view)
│   │   │   │   │       ├── reports/
│   │   │   │   │       │   └── page.tsx  # Submit reports
│   │   │   │   │       └── certificates/
│   │   │   │   │           └── page.tsx  # Issue certificates
│   │   │   │   └── profile/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   └── admin/
│   │   │       ├── layout.tsx            # Admin-specific sidebar config
│   │   │       ├── dashboard/
│   │   │       │   └── page.tsx
│   │   │       ├── proposals/
│   │   │       │   ├── page.tsx          # Review queue
│   │   │       │   └── [proposalId]/
│   │   │       │       └── page.tsx      # Proposal detail & decision
│   │   │       ├── events/
│   │   │       │   ├── page.tsx          # All events overview
│   │   │       │   └── [eventId]/
│   │   │       │       └── page.tsx      # Event detail (admin view)
│   │   │       ├── users/
│   │   │       │   └── page.tsx          # User management
│   │   │       └── profile/
│   │   │           └── page.tsx
│   │   │
│   │   ├── unauthorized/
│   │   │   └── page.tsx
│   │   ├── not-found.tsx                 # Global 404
│   │   ├── error.tsx                     # Global error boundary
│   │   ├── loading.tsx                   # Global loading state
│   │   ├── layout.tsx                    # Root layout (fonts, providers)
│   │   └── page.tsx                      # Root redirect → /login
│   │
│   ├── components/
│   │   │   ├── Button.tsx
│   │   │   ├── Badge.tsx                 # Status badges
│   │   │   ├── Modal.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Textarea.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── Tooltip.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Tabs.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   └── EmptyState.tsx
│   │   │
│   │   ├── layout/                       # Shell / navigation components
│   │   │   ├── TopNav.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── SidebarLinks.tsx          # Role-aware link config
│   │   │   └── NotificationPanel.tsx
│   │   │
│   │   ├── shared/                       # Cross-role feature components
│   │   │   ├── PdfUploader.tsx           # Drag-drop PDF upload
│   │   │   ├── PdfViewer.tsx             # Inline PDF preview modal
│   │   │   ├── EventCard.tsx             # Used in dashboard + calendar
│   │   │   ├── EventStatusBadge.tsx
│   │   │   ├── CertificateModal.tsx      # Preview + download
│   │   │   ├── CountdownBanner.tsx       # 14-day report deadline
│   │   │   └── DeadlineAlert.tsx
│   │   │
│   │   ├── student/                      # Student-specific components
│   │   │   ├── VolunteerApplicationForm.tsx
│   │   │   ├── VolunteerApplicationCard.tsx
│   │   │   ├── CertificateCard.tsx
│   │   │   └── EventCalendarView.tsx
│   │   │
│   │   ├── lead/                         # Lead-specific components
│   │   │   ├── EventProposalForm.tsx
│   │   │   ├── VolunteerApplicantTable.tsx
│   │   │   ├── ReportUploadForm.tsx
│   │   │   └── CertificateIssuer.tsx
│   │   │
│   │   └── admin/                        # Admin-specific components
│   │       ├── ProposalReviewCard.tsx
│   │       ├── DecisionForm.tsx
│   │       ├── UserRoleEditor.tsx
│   │       └── StatsSummaryRow.tsx
```

## 3. Development Guidelines

1. **Keep Pages Thin:** The files inside `src/app/` should mostly map to specific routes. Actual business logic and major UI components should be abstracted away into the components directories.
2. **Component Separation:** Always verify if a component is generic (place in `src/components/`), layout-specific (place in `src/components/layout/`), shared between roles (place in `src/components/shared/`), or completely specific to one role (e.g. `src/components/admin/`).
3. **Responsive Design:** Ensure all components are built mobile-first.
4. **Use Shared UI:** Before building a button, modal, or status badge, check if it already exists in the base `src/components/` directory.

## 4. Setting up the Development Environment

1. Ensure you have Node.js (v20+) installed.
2. Open your terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   The application will be available at [http://localhost:3000](http://localhost:3000).

## 5. Available Scripts

| Command         | Description                                     |
| --------------- | ----------------------------------------------- |
| `npm run dev`   | Starts the Next.js development server           |
| `npm run build` | Builds the application for production           |
| `npm run start` | Starts the production server (after building)   |
| `npm run lint`  | Runs ESLint to check for code quality issues    |
