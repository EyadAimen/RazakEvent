# RazakEvent

An event management web application developed for **Kolej Tun Razak (KTR)** at **Universiti Teknologi Malaysia (UTM)**. RazakEvent streamlines the process of creating, managing, and discovering events within the college, providing a centralised platform for students, staff, and administrators.

## About

RazakEvent is built to help the KTR community stay connected and informed about upcoming events, activities, and programmes organised by the college. The application provides:

- **Event Management** — Create, update, and manage events with detailed information.
- **Event Discovery** — Browse and search for upcoming events happening at KTR.
- **Centralised Platform** — A single source of truth for all college-related events.

## Tech Stack

| Layer    | Technology                          |
| -------- | ----------------------------------- |
| Frontend | Next.js 16, React 19, TypeScript    |
| Backend  | Express 5, Node.js (ESM)            |
| Database | PostgreSQL (via TypeORM)                 |
| Tooling  | ESLint, Nodemon, dotenv             |

## Prerequisites

Before setting up the project, make sure you have the following installed on your machine:

- **Node.js** (v20 or later) — [https://nodejs.org](https://nodejs.org)
- **npm** (comes with Node.js)
- **MySQL** (v8 or later) — [https://dev.mysql.com/downloads/](https://dev.mysql.com/downloads/)
- **Git** — [https://git-scm.com](https://git-scm.com)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/EyadAimen/RazakEvent.git
cd RazakEvent
```

### 2. Set Up the Database

1. Open your MySQL client (e.g. MySQL Workbench or the command line).
2. Create a new database for the project:

```sql
CREATE DATABASE razak_event;
```

### 3. Set Up the Backend

Please refer to the [Backend Development Guidelines](./backend/BACKEND_DEVELOPMENT.md) for detailed instructions on setting up and running the Express API server, as well as an overview of the feature-based backend architecture.

### 4. Set Up the Frontend

Please refer to the [Frontend Development Guidelines](./frontend/FRONTEND_DEVELOPMENT.md) for detailed instructions on setting up and running the Next.js frontend, as well as an overview of its feature-sliced architecture.

## Project Structure

```
RazakEvent/
├── backend/                   # Express API server (See backend/BACKEND_DEVELOPMENT.md for details)
├── frontend/                  # Next.js frontend app (See frontend/FRONTEND_DEVELOPMENT.md for details)
├── docs/                      # Project documentation (UI screens, features, JIRA)
├── .gitignore
└── README.md
```


## License

This project is developed for academic purposes at Universiti Teknologi Malaysia (UTM).

