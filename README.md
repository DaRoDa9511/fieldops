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

## AI document extraction (`supabase/functions/extract-document`)

Technicians photograph a supplier invoice or delivery note; a Supabase Edge Function extracts
vendor, invoice number, date, line items and totals into `scanned_documents`
(`processing → extracted | failed`), and the admin dashboard updates live via Realtime.

- **Live mode** — calls Claude (vision + schema-validated structured output via the official
  Anthropic SDK). The API key lives only as an Edge Function secret, never in the apps:

  ```bash
  supabase secrets set ANTHROPIC_API_KEY=sk-ant-...      # enables live AI
  supabase secrets set ANTHROPIC_MODEL=claude-opus-5-5   # optional override
  ```

- **Demo mode** (default when no key is set) — the full pipeline runs for real (upload, private
  storage, auth checks, DB updates, realtime), but the model call is replaced by realistic
  simulated data. Results are clearly labelled "Demo mode" in both apps. This keeps the public
  portfolio demo free to run and impossible to abuse.

## Scripts

| Command             | What it does          |
| ------------------- | --------------------- |
| `npm start`         | Expo dev server       |
| `npm run typecheck` | TypeScript (strict)   |
| `npm run lint`      | ESLint (expo config)  |
