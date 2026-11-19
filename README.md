# FieldOps

AI-powered field service & maintenance management — React Native (Expo) app for technicians,
React admin panel for managers, Supabase backend.

> Full README (architecture, screenshots, demo) coming in Phase 5.

## Quick start

```bash
cp .env.example .env   # fill in your Supabase URL + publishable key
npm install
npm start              # press a (Android), i (iOS) or w (web)
```

Seed demo data by running [`supabase/seed.sql`](supabase/seed.sql) in the Supabase SQL editor
(demo credentials are listed at the top of that file).

## Admin panel (`/admin`)

React + Vite + TypeScript + Tailwind CSS v4 + Recharts. Admin-only login, live dashboard
(Supabase Realtime), work-order CRUD/assignment, order detail with photos, signature and
AI-scanned documents, customers and technicians.

```bash
cd admin
cp .env.example .env   # VITE_SUPABASE_URL / VITE_SUPABASE_KEY
npm install
npm run dev            # http://localhost:5173
```

## Scripts

| Command             | What it does          |
| ------------------- | --------------------- |
| `npm start`         | Expo dev server       |
| `npm run typecheck` | TypeScript (strict)   |
| `npm run lint`      | ESLint (expo config)  |
