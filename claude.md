# FieldOps — Project Context for Claude Code

## Who I am and why this project exists
I'm Danilo Romero (DRD Software), a Systems Engineer from Bolivia freelancing on Upwork
("Systems Engineer | Custom Web & Mobile Apps, Databases & Automation").
FieldOps is my **flagship portfolio project**. Its goal is to make an Upwork client look at it and
think "this person really knows what he's doing". Quality, polish and a great demo matter more
than the number of features.

My stack: React, React Native + Expo, Android Studio (Java), C#/ASP.NET Core, Python, PHP,
PostgreSQL, SQL Server, Supabase. I'm learning n8n. Explain decisions briefly as you go so I
learn and can defend the code in client interviews.

## The product
**FieldOps — AI-powered field service & maintenance management.**
Companies with field technicians (maintenance, installation, repairs) lose time with paper
work orders and re-typing invoices by hand. FieldOps fixes that:

1. **Mobile app (technicians)** — React Native + Expo (this repo root)
   - Login (Supabase Auth, email + password)
   - "My work orders" list: filter by status/priority, pull to refresh
   - Work order detail: customer, address (open in maps), description, priority
   - Start job → In progress → Complete (status flow)
   - Take/attach photos (expo-image-picker / expo-camera) → upload to Storage
   - Capture customer signature on completion → upload to `signatures` bucket
   - **WOW feature: scan an invoice/delivery note with the camera → AI extracts vendor,
     invoice number, date, line items, totals → shows the extracted data for review → saved
     to `scanned_documents`**
   - Clean, modern UI, dark/light mode, loading skeletons, empty states, error handling

2. **Web admin panel (managers)** — React + Vite + TypeScript in `/admin`, deployed on Vercel
   - Login (admin role only)
   - Dashboard: KPIs (open / in progress / completed today, avg completion time), charts
   - Work orders table: create, assign to technician, edit, filter, search
   - **Realtime**: when a technician completes an order or scans a document on the phone,
     the dashboard updates live without refresh (Supabase Realtime) — key demo moment
   - Order detail: photos gallery, signature, scanned documents with extracted data
   - Customers management, technicians list
   - Map view of today's jobs (optional, phase 3)

3. **AI document extraction** — Supabase Edge Function `extract-document`
   - Receives the storage path of the uploaded image, sends it to a vision-capable LLM
     (OpenAI or Claude API) with a strict JSON schema, writes results to `scanned_documents`
     (status `processing` → `extracted` / `failed`).
   - **API keys NEVER go in the app.** Store them as Edge Function secrets. Ask me for the key
     when you get to this step.

## Supabase (already created and configured)
- Organization: DRD Software
- Project: `fieldops` — ref `dlpwdbpftumnzfpgtqqr` — region us-east-1
- URL: https://dlpwdbpftumnzfpgtqqr.supabase.co
- Publishable key (safe for client apps): `sb_publishable_2a2USBlpnVI88erbMkdHrg_rxM_JQZk`
- Put these in `.env` as `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_KEY`
  (and `VITE_SUPABASE_URL` / `VITE_SUPABASE_KEY` for `/admin`). Add `.env` to `.gitignore`
  and commit a `.env.example`.

### Database schema (already applied — inspect before changing; use migrations for changes)
- Enums: `user_role` (admin, technician), `order_status` (pending, in_progress, completed,
  cancelled), `order_priority` (low, medium, high, urgent), `document_status`
  (processing, extracted, verified, failed)
- `profiles` — id (= auth.users.id), full_name, role (default technician), phone, avatar_url.
  Auto-created by trigger on signup.
- `customers` — name, address, phone, email, latitude, longitude
- `work_orders` — code (auto, e.g. WO-261118-ab12), title, description, customer_id,
  assigned_to, created_by, status, priority, scheduled_for, started_at, completed_at
  (auto-set by trigger on status change), technician_notes, signature_path, updated_at
- `work_order_photos` — work_order_id, storage_path, caption, uploaded_by
- `scanned_documents` — work_order_id, storage_path, status, vendor_name, invoice_number,
  invoice_date, subtotal, tax, total_amount, currency, line_items (jsonb), ai_raw (jsonb),
  confidence
- RLS enabled on all tables. Admins (`public.is_admin()`) manage everything; technicians
  only see/update orders assigned to them and their photos/documents.
- Realtime enabled on `work_orders` and `scanned_documents`.
- Private storage buckets: `work-order-photos`, `documents`, `signatures`
  (authenticated read; upload where owner = auth.uid(); admin delete). Use signed URLs.

## Roadmap (work in this order, commit after each step)
**Phase 1 — Foundation**
- Expo Router + TypeScript, supabase-js client, auth flow with session persistence
- Seed script: 1 admin, 3 technicians, 8 customers, ~20 realistic work orders
  (tell me the demo credentials you create)
**Phase 2 — Mobile core**: orders list, detail, status flow, photos, signature
**Phase 3 — Admin panel** in `/admin`: auth, dashboard, orders CRUD, realtime, deploy to Vercel
**Phase 4 — AI scanning**: edge function + mobile scan flow + admin view of extracted data
**Phase 5 — Portfolio polish**
- README.md in English: problem → solution → features → architecture diagram → tech stack →
  screenshots/GIF → demo credentials → how to run
- Screenshots of key screens and a 30–60s demo GIF/video
- Short case-study text I can paste into my Upwork portfolio
  (Problem / What I built / Tools / Result)

## Conventions
- TypeScript everywhere, strict mode. Generate DB types from Supabase.
- Small reusable components, a consistent design system (colors, spacing, typography).
- Handle loading, empty and error states on every screen.
- Never commit secrets. Never disable RLS to "make it work" — fix the policy instead.
- Conventional commits (feat:, fix:, chore:). Push to my GitHub repo `fieldops` (public).
- Ask me before installing large dependencies or making architecture changes.
