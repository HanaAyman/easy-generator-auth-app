# Auth App

A production-style sign-up / sign-in module: a NestJS + MongoDB API and a React + TypeScript
frontend, sharing one session model based on an httpOnly JWT cookie.

## Architecture

```
auth-app/
  backend/    NestJS API (Mongoose, Passport JWT, class-validator, Swagger)
  frontend/   React + TypeScript
```

- **Session model**: on sign up / sign in, the API sets the JWT in an `httpOnly`, `Secure`
  (in production), cookie named `access_token`. The frontend never reads or
  stores the token itself — it holds the browser's cookie jar and calls `GET /users/me` to
  learn whether a session exists. This avoids exposing the token to JavaScript (and therefore
  to XSS), at the cost of requiring `withCredentials`/CORS credentials wiring, which is
  already set up on both sides.
- **Password storage**: bcrypt (via `bcryptjs`, a pure-JS implementation — avoids native
  build tooling requirements) with 12 salt rounds. The password hash field is excluded from
  Mongoose's default `find` projections and is never present in any API response.
- **Validation**: the same rules are enforced twice — `class-validator` DTOs on the backend
  (the source of truth) and a matching `zod` schema on the frontend (for instant inline
  feedback). Email format, name ≥ 3 characters, password ≥ 8 characters with a letter, a
  digit, and a special character.

## Prerequisites

- Node.js
- A MongoDB connection string.

## Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Fill in `backend/.env`:

| Variable         | Description                                                         |
| ---------------- | ------------------------------------------------------------------- |
| `MONGODB_URI`    | Your MongoDB Atlas (or other) connection string                     |
| `JWT_SECRET`     | A long random string.                                               |
| `JWT_EXPIRES_IN` | Access token / cookie lifetime                                      |
| `CORS_ORIGIN`    | The exact origin the frontend runs on, e.g. `http://localhost:5173` |
| `PORT`           | API port, defaults to `3000`                                        |

Run it:

```bash
npm run start:dev      # http://localhost:3000, watches for changes
npm run lint           # ESLint
npm run build          # production build to dist/
npm test               # unit tests (Jest)
npm run test:e2e       # e2e tests against an in-memory MongoDB (mongodb-memory-server)
```

Swagger/OpenAPI docs are served at `http://localhost:3000/api/docs` once the server is running.

### API endpoints

| Method | Path           | Auth           | Description                                        |
| ------ | -------------- | -------------- | -------------------------------------------------- |
| POST   | `/auth/signup` | –              | Create an account, sets the session cookie         |
| POST   | `/auth/signin` | –              | Authenticate, sets the session cookie              |
| POST   | `/auth/logout` | session cookie | Clears the session cookie                          |
| GET    | `/users/me`    | session cookie | **Protected** — returns the current user's profile |
| GET    | `/health`      | –              | Liveness check                                     |

`/auth/signup` and `/auth/signin` are rate-limited (5 and 10 requests/minute per IP,
respectively) to blunt brute-force and credential-stuffing attempts.

## Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
```

`frontend/.env` only needs `VITE_API_URL`, pointing at the backend (default
`http://localhost:3000`).

```bash
npm run dev        # http://localhost:5173
npm run lint        # oxlint
npm test            # Vitest + React Testing Library
npm run build       # production build to dist/
```

### Pages

- `/signup` — create an account
- `/signin` — sign in
- `/` — protected welcome page ("Welcome to the application."), with a logout button;
  redirects to `/signin` if there is no active session

## Running the full stack locally

1. Start the backend (`npm run start:dev` in `backend/`), pointed at your MongoDB Atlas URI.
2. Start the frontend (`npm run dev` in `frontend/`).
3. Visit `http://localhost:5173`, sign up, and you'll land on the welcome page.

## CI

`.github/workflows/ci.yml` runs lint, build, and tests for both `backend/` and `frontend/`
on every push and pull request to `main`.
