# FieldOps — Upwork portfolio case study

Copy the English version into your Upwork portfolio item. Suggested media order:
`docs/images/showcase.png` (cover) → `docs/images/demo.gif` → `admin-dashboard-dark.png` →
`mobile-scan-result.png` → `admin-order-detail.png`.
Links: code https://github.com/DaRoDa9511/fieldops · live demo https://fieldops-admin-eight.vercel.app
(login `olivia.bennett@fieldops.demo` / `FieldOps#2026`).

---

## 🇺🇸 English (paste into Upwork)

**Project title:** FieldOps — AI-Powered Field Service App (React Native + React + Supabase)

**Role:** Full-stack developer — mobile, web, database & AI integration

**Skills:** React Native · Expo · React · TypeScript · Supabase · PostgreSQL · Row Level Security · Realtime · Tailwind CSS · Claude AI · REST/Edge Functions

### Problem
Maintenance and installation companies still manage technicians with paper work orders and
WhatsApp. Dispatchers don't know when a job is finished, proof of work (photos, customer
signatures) gets lost, and supplier invoices are re-typed by hand — slow, error-prone and with
no reliable numbers for managers.

### What I built
A complete field-service platform with three parts:

- **Technician mobile app (React Native / Expo):** today's jobs sorted by urgency, one-tap
  Start → Complete flow, photos, on-screen customer signature, directions and call, dark mode
  and English/Spanish.
- **Dispatcher web dashboard (React + Tailwind):** live KPIs and charts, create and assign work
  orders, customers and technician status. It **updates in real time** — when a technician
  finishes a job on the phone, the dashboard changes instantly with a notification.
- **AI invoice scanning:** the technician photographs a supplier invoice; a secure serverless
  function uses AI vision to extract vendor, invoice number, date, line items and totals into
  the database for the dispatcher to verify — no manual data entry.

Security was designed in from the start: role-based access enforced by the database
(Row Level Security), private file storage with expiring links, and AI keys kept server-side.

### Tools
React Native, Expo, React, TypeScript, Vite, Tailwind CSS, Supabase (PostgreSQL, Auth,
Storage, Realtime, Edge Functions), Claude AI (vision + structured output), Recharts.

### Result
- Paper-free workflow from assignment to signed completion, with photo and signature proof.
- Dispatchers see job progress **live**, with no calls or page refreshes.
- Supplier invoices captured in seconds instead of manual typing.
- Production-ready foundations: typed end to end, role-based security, bilingual UI,
  light/dark themes, loading/empty/error states on every screen.

---

## 🇪🇸 Español (referencia / clientes hispanohablantes)

**Título:** FieldOps — App de servicio técnico con IA (React Native + React + Supabase)

**Rol:** Desarrollador full-stack — móvil, web, base de datos e integración de IA

### Problema
Las empresas de mantenimiento e instalaciones todavía gestionan a sus técnicos con órdenes en
papel y WhatsApp. El despachador no sabe cuándo se terminó un trabajo, las evidencias (fotos,
firma del cliente) se pierden y las facturas de proveedores se digitan a mano: lento, con
errores y sin números confiables para la gerencia.

### Qué construí
Una plataforma completa de servicio técnico en tres partes:

- **App móvil para técnicos (React Native / Expo):** trabajos del día ordenados por urgencia,
  flujo Iniciar → Completar con un toque, fotos, firma del cliente en pantalla, cómo llegar y
  llamar, modo oscuro e inglés/español.
- **Panel web para despachadores (React + Tailwind):** KPIs y gráficos en vivo, crear y asignar
  órdenes, clientes y estado de técnicos. **Se actualiza en tiempo real**: cuando el técnico
  termina un trabajo en el teléfono, el panel cambia al instante con una notificación.
- **Escaneo de facturas con IA:** el técnico fotografía la factura del proveedor; una función
  serverless segura usa visión por IA para extraer proveedor, número, fecha, ítems y totales a
  la base de datos, para que el despachador la verifique — sin digitar nada.

La seguridad se diseñó desde el inicio: permisos por rol aplicados por la base de datos (Row
Level Security), archivos privados con enlaces que expiran y claves de IA solo en el servidor.

### Herramientas
React Native, Expo, React, TypeScript, Vite, Tailwind CSS, Supabase (PostgreSQL, Auth, Storage,
Realtime, Edge Functions), Claude AI (visión + salida estructurada), Recharts.

### Resultado
- Flujo sin papel desde la asignación hasta el cierre firmado, con evidencia de fotos y firma.
- El despachador ve el avance **en vivo**, sin llamadas ni recargar la página.
- Facturas de proveedores capturadas en segundos en vez de digitarlas.
- Base lista para producción: tipado de punta a punta, seguridad por roles, interfaz bilingüe,
  temas claro/oscuro y estados de carga/vacío/error en cada pantalla.

---

## Interview cheat-sheet (EN) — likely client questions

- **"Why Supabase?"** Postgres + Row Level Security gives authorization in one place, and
  Realtime made the live dashboard simple without running a websocket server.
- **"How is data protected?"** RLS on every table (technicians only see their own jobs), private
  storage with signed URLs, only the publishable key in the apps, AI key only as a server secret.
- **"How does the AI part work?"** Photo → private storage → Edge Function checks the user's
  permission → Claude vision returns JSON validated against a schema → saved as `extracted`
  (or `failed` with the reason). The public demo runs in demo mode so it can't burn credits.
- **"Can it scale?"** KPIs are computed client-side for the demo; at scale they move to
  Postgres views/RPCs. Realtime and RLS scale with Supabase; the mobile app is a standard
  Expo build for the App Store / Play Store.
