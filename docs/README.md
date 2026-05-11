# Quanta Loop — documentation

This repository contains the **Quanta Loop** Phase 1 foundation: a premium B2B industrial byproduct recovery network (not a consumer marketplace).

## Layout

- `frontend/` — Next.js (App Router), TypeScript, Tailwind, Zustand, Axios, React Hook Form, Zod
- `backend/` — Express, MongoDB (Mongoose), JWT + httpOnly cookie, Zod validation
- `docs/` — high-level references (this folder)

## Local development

**Backend**

1. Copy `backend/.env.example` to `backend/.env` and set `MONGO_URI`, `JWT_SECRET` (16+ characters), and `CLIENT_ORIGIN` (usually `http://localhost:3000`).
2. From `backend/`: `npm run dev`

**Frontend**

1. Copy `frontend/.env.local.example` to `frontend/.env.local` and align `NEXT_PUBLIC_API_URL` with the API origin (default `http://localhost:5000`).
2. From `frontend/`: `npm run dev`

## API surface (Phase 1–2)

- `GET /` — plain text health string
- `POST /api/v1/auth/register` — create account (public roles only)
- `POST /api/v1/auth/login` — issue JWT + `ql_at` httpOnly cookie
- `POST /api/v1/auth/logout` — clear cookie
- `GET /api/v1/materials` — list materials (role-scoped: providers see theirs, buyers see active network materials, admins see all)
- `POST /api/v1/materials` — create material (`material_provider`, `admin` only)
- `GET /api/v1/materials/:id` — material detail (authorization by role and visibility)
- `PATCH /api/v1/materials/:id` — update material (owner provider or `admin`; buyers cannot mutate)

### Phase 3 — interests, notifications, matching

- `POST /api/v1/interests` — express interest (`verified_buyer` only; one row per buyer+material)
- `GET /api/v1/interests/my` — role-scoped list (provider: inbound, buyer: outbound, admin: all)
- `GET /api/v1/interests/material/:materialId/me` — current buyer’s interest for a material (or null)
- `PATCH /api/v1/interests/:id/status` — accept / reject (`material_provider` owner or `admin`)
- `GET /api/v1/notifications/unread-count` — unread count for the signed-in user
- `GET /api/v1/notifications` — inbox for the signed-in user
- `PATCH /api/v1/notifications/:id/read` — mark one notification read
- `GET /api/v1/matches/suggestions` — lightweight, non-ML suggestions by role (buyer: scored materials; provider: buyer signals)

## Phase 2+

Matching engines, material catalogs, verification workflows, and admin tooling will extend the existing module boundaries without rewriting the foundation.
