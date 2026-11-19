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

## Scripts

| Command             | What it does          |
| ------------------- | --------------------- |
| `npm start`         | Expo dev server       |
| `npm run typecheck` | TypeScript (strict)   |
| `npm run lint`      | ESLint (expo config)  |
