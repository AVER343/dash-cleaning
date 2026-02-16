# Home Cleaning Admin Dashboard

Next.js + Drizzle + Neon admin dashboard for a booking appointment landing page app.

## Features

- Password-gated admin access (`/admin/login`)
- Dashboard overview (`/admin`)
  - KPI cards
  - status chart
  - recent bookings
- Full CRUD for:
  - `bookings`
  - `locations`
  - `pricing`
- Soft delete for all three entities
- Additive SQL migration for:
  - `deleted_at`
  - typed `appointment_date` / `appointment_time`
  - `updated_at` and timestamps where missing
  - enum-backed booking status
  - dashboard performance indexes

## Tech Stack

- Next.js (App Router, TypeScript)
- Drizzle ORM + drizzle-kit
- Postgres client: `postgres`
- Validation: `zod`
- Session tokens: `jose`
- Charts: `recharts`
- Tests: `vitest`

## Environment Variables

Copy `.env.example` values:

- `DATABASE_URL`
- `ADMIN_PASSWORD`
- `AUTH_SECRET`

## Setup

```bash
npm install
npm run db:migrate
npm run dev
```

Open:

- App: `http://localhost:3000`
- Admin login: `http://localhost:3000/admin/login`

## Available Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run db:generate`
- `npm run db:migrate`
- `npm run db:studio`
- `npm run test`

## API Summary

- `POST /api/admin/auth/login`
- `POST /api/admin/auth/logout`
- `GET /api/admin/dashboard/summary`
- `GET/POST /api/admin/bookings`
- `GET/PATCH/DELETE /api/admin/bookings/:id`
- `GET/POST /api/admin/locations`
- `GET/PATCH/DELETE /api/admin/locations/:id`
- `GET/POST /api/admin/pricing`
- `GET/PATCH/DELETE /api/admin/pricing/:id`

## Notes

- Middleware protects `/admin` and `/api/admin/*` except login.
- `bookings.date` and `bookings.time` legacy text columns are preserved.
- Typed columns are backfilled where parser can recognize input.
- Deletes are soft (`deleted_at` set), and list endpoints exclude deleted rows by default.
