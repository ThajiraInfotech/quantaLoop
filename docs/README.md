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

## API surface (Phase 1)

- `GET /` — plain text health string
- `POST /api/v1/auth/register` — create account (public roles only)
- `POST /api/v1/auth/login` — issue JWT + `ql_at` httpOnly cookie
- `POST /api/v1/auth/logout` — clear cookie
- `GET /api/v1/materials` — authenticated placeholder list

## Phase 2+

Matching engines, material catalogs, verification workflows, and admin tooling will extend the existing module boundaries without rewriting the foundation.
