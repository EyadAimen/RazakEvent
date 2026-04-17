# RazakEvent — Backend Development Guidelines

This document outlines the architecture, setup, and development guidelines for the RazakEvent backend API. Each feature domain has its own dedicated folder inside `src/`, keeping the codebase modular and scalable.

## 1. System Overview & Tech Stack

- **Runtime:** Node.js (v20+)
- **Framework:** Express 5 (ESM modules via `.mjs`)
- **ORM:** TypeORM
- **Database:** PostgreSQL
- **Tooling:** Nodemon, dotenv, ESLint

## 2. Directory Structure

```text
razakevent-backend/
├── config/
│   ├── dbConfig.mjs              # TypeORM DataSource configuration
│   └── envConfig.mjs             # Environment variable loader (dotenv)
│
├── src/
│   ├── server.mjs                # Express app entry point & route registration
│   │
│   ├── auth/                     # Authentication & authorisation
│   │   ├── auth.routes.mjs       # POST /api/auth/login, POST /api/auth/logout
│   │   ├── auth.controller.mjs   # Request handlers

│   │
│   ├── users/                    # User accounts & role management
│   │   ├── users.routes.mjs      # GET /api/users, PATCH /api/users/:id/role
│   │   ├── users.controller.mjs
│   │   ├── users.service.mjs
│   │   └── users.entity.mjs      # User entity (name, email, role, studentId)
│   │
│   ├── events/                   # Event lifecycle (CRUD + status tracking)
│   │   ├── events.routes.mjs     # GET /api/events, GET /api/events/:id, etc.
│   │   ├── events.controller.mjs
│   │   ├── events.service.mjs
│   │   └── events.entity.mjs     # Event entity (name, date, venue, status, budget)
│   │
│   ├── proposals/                # Event proposal submission & admin review
│   │   ├── proposals.routes.mjs  # POST /api/proposals, PATCH /api/proposals/:id/decision
│   │   ├── proposals.controller.mjs
│   │   ├── proposals.service.mjs
│   │   └── proposals.entity.mjs  # Proposal entity (eventId, pdfPath, status, adminComment)
│   │
│   ├── volunteering/             # Volunteer slots & student applications
│   │   ├── volunteering.routes.mjs
│   │   ├── volunteering.controller.mjs
│   │   ├── volunteering.service.mjs
│   │   └── volunteering.entity.mjs  # VolunteerApplication entity (userId, eventId, status)
│   │
│   ├── certificates/             # Certificate generation & download
│   │   ├── certificates.routes.mjs
│   │   ├── certificates.controller.mjs
│   │   ├── certificates.service.mjs
│   │   └── certificates.entity.mjs  # Certificate entity (userId, eventId, role, pdfPath)
│   │
│   ├── reports/                  # Post-event & money report submission
│   │   ├── reports.routes.mjs
│   │   ├── reports.controller.mjs
│   │   ├── reports.service.mjs
│   │   └── reports.entity.mjs    # Report entity (eventId, type, pdfPath, submittedAt)
│   │
│   ├── notifications/            # In-app notification system
│   │   ├── notifications.routes.mjs
│   │   ├── notifications.controller.mjs
│   │   ├── notifications.service.mjs
│   │   └── notifications.entity.mjs  # Notification entity (userId, message, read, type)
│   │
│   └── shared/                   # Cross-cutting helpers & utilities
│       ├── upload.middleware.mjs  # Multer / file-upload handling (PDF)
│       ├── pagination.utils.mjs  # Reusable pagination query helper
│       ├── errors.mjs            # Custom error classes (NotFoundError, ForbiddenError)
│       └── response.utils.mjs   # Standardised JSON response wrappers
│
├── .env                          # Environment variables (not committed)
├── .env.example                  # Template for required env vars
└── package.json
```

## 3. Feature Module Convention

Every feature folder inside `src/` follows a consistent four-file pattern:

| File                      | Responsibility                                                                 |
| ------------------------- | ------------------------------------------------------------------------------ |
| `feature.routes.mjs`      | Registers Express routes and applies middleware (auth, validation).             |
| `feature.controller.mjs`  | Handles HTTP request/response — extracts params, calls service, sends result.  |
| `feature.service.mjs`     | Contains all business logic — interacts with entities/repositories.            |
| `feature.entity.mjs`      | TypeORM entity definition — maps to a database table.                          |

> **Rule:** Controllers should never call the database directly. Always go through the service layer.

## 4. Development Guidelines

1. **One Feature, One Folder:** Every distinct business domain lives in its own directory under `src/`. Don't mix event logic into the volunteering folder.
2. **Use the Shared Folder:** Cross-cutting concerns like file uploads, pagination, error handling, and response formatting go into `src/shared/`.
3. **Middleware Composition:** Auth/role-check middleware lives in `src/auth/auth.middleware.mjs` and is imported by other feature route files as needed.
4. **Route Registration:** All feature routes should be imported and mounted in `src/server.mjs` under a versioned prefix like `/api`.
5. **Error Handling:** Use the custom error classes from `src/shared/errors.mjs` and a global Express error handler in `server.mjs`.

## 5. Setting up the Development Environment

1. Ensure you have Node.js (v20+) and PostgreSQL installed.
2. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```
4. Create the environment file:
   ```bash
   cp .env.example .env
   ```
5. Fill in your database credentials in `.env`:
   ```env
   HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=your_password
   DATABASE=razak_event
   PORT=5000
   ```
6. Start the development server:
   ```bash
   npm run dev
   ```
   The API server will start on `http://localhost:5000`.

## 6. Available Scripts

| Command       | Description                                        |
| ------------- | -------------------------------------------------- |
| `npm run dev` | Start the server with Nodemon (hot reload)         |
