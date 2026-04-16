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
| Database | MySQL (via TypeORM)                 |
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

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Create the environment file
cp .env.example .env
```

Open the `.env` file and fill in your database credentials:

```env
HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DATABASE=razak_event
PORT=5000
```

Start the backend development server:

```bash
npm run dev
```

The API server will start on `http://localhost:5000`.

### 4. Set Up the Frontend

Open a **new terminal** and run:

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will start on `http://localhost:3000`.

## Project Structure

```
RazakEvent/
├── backend/
│   ├── config/
│   │   ├── dbConfig.mjs      # TypeORM database connection
│   │   └── envConfig.mjs     # Environment variable loader
│   ├── src/
│   │   └── server.mjs        # Express server entry point
│   ├── .env                   # Environment variables (not committed)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/               # Next.js App Router pages
│   │   └── components/        # Reusable React components
│   ├── public/                # Static assets
│   ├── next.config.ts
│   ├── tsconfig.json
│   └── package.json
├── .gitignore
└── README.md
```

## Available Scripts

### Backend (`/backend`)

| Command       | Description                              |
| ------------- | ---------------------------------------- |
| `npm run dev` | Start the server with Nodemon (hot reload) |

### Frontend (`/frontend`)

| Command         | Description                        |
| --------------- | ---------------------------------- |
| `npm run dev`   | Start the Next.js dev server       |
| `npm run build` | Build for production               |
| `npm run start` | Start the production server        |
| `npm run lint`  | Run ESLint                         |


## License

This project is developed for academic purposes at Universiti Teknologi Malaysia (UTM).
