# StudentLife AI

> Never Run Out of Money Before Month-End.

The financial companion / operating system for student life.

## Phase 1 — Database + Auth Foundation

This phase includes:

- PostgreSQL schema via Prisma (all core tables)
- Auth foundation (signup, login, logout, session cookies)
- Protected route middleware
- Validation, error handling, reusable services

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- PostgreSQL + Prisma ORM
- bcryptjs (password hashing) + jose (JWT sessions)
- Zod (request validation)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` (already present for local dev) and set:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/studentlife_ai?schema=public"
AUTH_SECRET="your-long-random-secret"
```

Create the database if needed:

```sql
CREATE DATABASE studentlife_ai;
```

### 3. Push schema & generate client

```bash
npm run db:push
npm run db:generate
```

Or use migrations:

```bash
npm run db:migrate
```

### 4. (Optional) Seed demo user

```bash
npm run db:seed
```

Demo credentials: `demo@studentlife.ai` / `Demo1234!`

### 5. Grant Owner access (optional)

There is **no** default admin account. After signing up (or using the demo user):

```bash
npm run admin:grant -- --email="demo@studentlife.ai"
```

Open `/admin` while logged in as that user. Revoke with:

```bash
npm run admin:revoke -- --email="demo@studentlife.ai"
```

See `docs/ADMIN_DASHBOARD.md` and `docs/SECURITY.md`.

### 6. Start the app

```bash
npm run dev
```

## Security & admin docs

- `docs/SECURITY.md`
- `docs/ADMIN_DASHBOARD.md`
- `docs/ANALYTICS_PRIVACY.md`
- `docs/INCIDENT_RESPONSE.md`
- `docs/DEPLOYMENT_SECURITY.md`

## Auth API (Phase 1)

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/signup` | Create account + session |
| POST | `/api/auth/login` | Login + session |
| POST | `/api/auth/logout` | Clear session |
| GET | `/api/auth/me` | Current user |

### Signup body

```json
{ "email": "you@college.edu", "password": "Secret123", "name": "Alex" }
```

### Login body

```json
{ "email": "you@college.edu", "password": "Secret123" }
```

## Project structure (Phase 1)

```
prisma/
  schema.prisma      # Full data model
  seed.ts            # Demo-only seed
src/
  app/api/auth/      # Auth API routes
  lib/
    db.ts            # Prisma client
    api.ts           # Response helpers
    auth/            # Password, session, requireUser
    validations/     # Zod schemas
  services/          # Business logic (auth.service)
  types/             # Shared types
  middleware.ts      # Protected route guards
```

## Next phases

- Phase 2: Onboarding + Pocket Money Mode + Dashboard (End of Month Survival)
- Phase 3: Expenses, income, budgets, goals APIs + UI
- Phase 4: Can I Afford It + Financial Health Score + AI Coach
- Phase 5: Student life tools + Premium gating + PWA
