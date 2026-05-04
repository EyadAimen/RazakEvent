## Backend Setup

### Prerequisites
- Node.js v20+
- PostgreSQL

### Steps

1. Navigate to the backend directory:
   cd backend

2. Install dependencies:
   npm install

3. Create the environment file:
   cp .env.example .env

4. Fill in your values in .env:
   HOST = localhost
   DB_PORT = 5432
   DB_USER = postgres
   DB_PASSWORD = your_postgres_password
   DATABASE = razak_event
   PORT = 5000
   JWT_SECRET = any_long_random_string

5. Create the database in PostgreSQL:
   sudo -u postgres psql
   CREATE DATABASE razak_event;
   \q

6. Start the dev server:
   npm run dev

Server runs on http://localhost:5000
