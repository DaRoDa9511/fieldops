-- =============================================================================
-- FieldOps demo seed
-- 1 admin, 3 technicians, 8 customers, 20 realistic work orders.
-- Dates are relative to now(), so a fresh seed always looks like "today's" workload.
--
-- Run it in the Supabase SQL editor (or via the MCP / `psql`). It is idempotent:
-- if the demo admin already exists it does nothing. To re-seed, run the RESET block at the
-- bottom first.
--
-- Demo credentials (public, demo-only — never reuse these anywhere real):
--   admin       olivia.bennett@fieldops.demo   / FieldOps#2026
--   technician  marcus.reed@fieldops.demo      / FieldOps#2026
--   technician  sofia.alvarez@fieldops.demo    / FieldOps#2026
--   technician  jamal.carter@fieldops.demo     / FieldOps#2026
-- =============================================================================

do $$
declare
  demo_password constant text := 'FieldOps#2026';
  v_admin uuid;
  v_techs uuid[] := array[]::uuid[];
  v_customers uuid[] := array[]::uuid[];
  u record;
  v_id uuid;
  v_today timestamptz := date_trunc('day', now());
begin
  if exists (select 1 from auth.users where email = 'olivia.bennett@fieldops.demo') then
    raise notice 'FieldOps demo data already present — skipping seed.';
    return;
  end if;

  -- ---------------------------------------------------------------------------
  -- Users (auth.users + auth.identities). The on-signup trigger creates profiles.
  -- Token columns must be '' (not NULL) or GoTrue fails to sign the user in.
  -- ---------------------------------------------------------------------------
  for u in
    select * from (values
      ('olivia.bennett@fieldops.demo', 'Olivia Bennett', 'admin',      '+1 512-555-0100'),
      ('marcus.reed@fieldops.demo',    'Marcus Reed',    'technician', '+1 512-555-0141'),
      ('sofia.alvarez@fieldops.demo',  'Sofia Alvarez',  'technician', '+1 512-555-0172'),
      ('jamal.carter@fieldops.demo',   'Jamal Carter',   'technician', '+1 512-555-0193')
    ) as t(email, full_name, role, phone)
  loop
    v_id := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token
    ) values (
      '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', u.email,
      extensions.crypt(demo_password, extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', u.full_name), now(), now(),
      '', '', '', '', '', '', '', ''
    );

    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (
      gen_random_uuid(), v_id, v_id::text,
      jsonb_build_object('sub', v_id::text, 'email', u.email, 'email_verified', true),
      'email', now(), now(), now()
    );

    update public.profiles
       set role = u.role::public.user_role, phone = u.phone, full_name = u.full_name
     where id = v_id;

    if u.role = 'admin' then
      v_admin := v_id;
    else
      v_techs := v_techs || v_id;
    end if;
  end loop;

  -- ---------------------------------------------------------------------------
  -- Customers (Austin, TX area — real-looking but fictional businesses)
  -- ---------------------------------------------------------------------------
  for u in
    select * from (values
      ('Riverside Medical Plaza',     '1201 S Congress Ave, Austin, TX 78704',     '+1 512-555-0201', 'facilities@riversidemed.example',  30.2502, -97.7497),
      ('Lone Star Coffee Roasters',   '2300 E Cesar Chavez St, Austin, TX 78702',  '+1 512-555-0212', 'ops@lonestarcoffee.example',       30.2564, -97.7192),
      ('Hill Country Fitness',        '4477 S Lamar Blvd, Austin, TX 78745',       '+1 512-555-0223', 'manager@hcfitness.example',        30.2324, -97.7905),
      ('Barton Creek Apartments',     '3001 S MoPac Expy, Austin, TX 78746',       '+1 512-555-0234', 'leasing@bartoncreekapts.example',  30.2601, -97.8053),
      ('Mueller Elementary School',   '1800 Aldrich St, Austin, TX 78723',         '+1 512-555-0245', 'maintenance@muellerelem.example',  30.2979, -97.7058),
      ('Domain Tech Offices',         '11410 Century Oaks Ter, Austin, TX 78758',  '+1 512-555-0256', 'it-facilities@domaintech.example', 30.4016, -97.7254),
      ('Zilker Grill & Taproom',      '2100 Barton Springs Rd, Austin, TX 78704',  '+1 512-555-0267', 'gm@zilkergrill.example',           30.2638, -97.7604),
      ('Cedar Park Logistics Center', '1890 Discovery Blvd, Cedar Park, TX 78613', '+1 512-555-0278', 'warehouse@cplogistics.example',    30.4856, -97.8203)
    ) as t(name, address, phone, email, lat, lng)
  loop
    insert into public.customers (name, address, phone, email, latitude, longitude)
    values (u.name, u.address, u.phone, u.email, u.lat, u.lng)
    returning id into v_id;
    v_customers := v_customers || v_id;
  end loop;

  -- ---------------------------------------------------------------------------
  -- Work orders
  --   c = customer index, t = technician index (null = unassigned)
  --   sched / started / completed are offsets from today 00:00
  -- ---------------------------------------------------------------------------
  insert into public.work_orders (
    code, title, description, customer_id, assigned_to, created_by, status, priority,
    scheduled_for, started_at, completed_at, technician_notes, created_at, updated_at
  )
  select
    'WO-' || to_char(v_today + w.sched - interval '2 days', 'YYMMDD') || '-' || substr(md5(random()::text), 1, 4),
    w.title, w.descr, v_customers[w.c], case when w.t is null then null else v_techs[w.t] end, v_admin,
    w.status::public.order_status, w.priority::public.order_priority,
    v_today + w.sched,
    case when w.started   is null then null else v_today + w.started end,
    case when w.completed is null then null else v_today + w.completed end,
    w.notes,
    v_today + w.sched - interval '2 days',
    coalesce(v_today + w.completed, v_today + w.started, v_today + w.sched - interval '2 days')
  from (values
    -- ---- Today ----
    ('Rooftop HVAC unit not cooling', 'Unit RTU-2 blowing warm air since this morning. Check refrigerant charge and condenser fan motor. Tenant reports clinic temperature at 81°F.',
      1, 1, 'in_progress', 'urgent',   interval '8 hours',  interval '8 hours 15 minutes', null::interval, 'Condenser fan capacitor failed. Replacement on the truck, swapping now.'),
    ('Espresso machine dedicated circuit tripping', 'Breaker #14 trips when both grinders and the La Marzocco run together. Verify load and inspect wiring.',
      2, 2, 'pending', 'high',       interval '10 hours', null, null, null),
    ('Quarterly fire extinguisher inspection', 'Inspect and tag 12 extinguishers across both floors. Replace any with low pressure.',
      3, 3, 'completed', 'medium',   interval '7 hours 30 minutes', interval '7 hours 35 minutes', interval '8 hours 40 minutes', 'All 12 units inspected and tagged. Unit by locker room recharged.'),
    ('Water heater leaking — Building C', 'Resident in C-214 reports water pooling around the 50-gal heater in the utility closet.',
      4, 1, 'pending', 'urgent',     interval '13 hours', null, null, null),
    ('Replace classroom LED panels', 'Rooms 104 and 106: 6 flickering 2x4 LED troffers. Panels delivered to front office.',
      5, 2, 'pending', 'low',        interval '14 hours', null, null, null),
    ('Server room AC preventive maintenance', 'Monthly PM on 2x Liebert units: filters, belts, condensate pump, alarm test.',
      6, 3, 'in_progress', 'high',   interval '9 hours',  interval '9 hours 10 minutes', null, 'Filters replaced on unit A. Starting unit B.'),
    ('Walk-in cooler temperature alarm', 'Cooler holding at 44°F (target 36°F). Possible evaporator icing.',
      7, null, 'pending', 'high',    interval '15 hours', null, null, null),

    -- ---- Upcoming ----
    ('Dock door #3 opener replacement', 'Overhead door motor burned out. Install new 1/2 HP opener and safety sensors.',
      8, 3, 'pending', 'medium',     interval '1 day 9 hours', null, null, null),
    ('Annual backflow preventer test', 'Test and certify 2 RPZ assemblies for city compliance. Submit report to utility.',
      1, 2, 'pending', 'medium',     interval '1 day 11 hours', null, null, null),
    ('Gym locker room exhaust fan noise', 'Loud grinding from ceiling exhaust fan in men''s locker room. Likely bearings.',
      3, 1, 'pending', 'low',        interval '2 days 10 hours', null, null, null),
    ('Parking lot light pole outage', 'Poles 4, 7 and 9 dark. Check photocell and ballasts; bucket truck required.',
      4, null, 'pending', 'medium',  interval '2 days 17 hours', null, null, null),
    ('Install EV charger (Level 2)', 'Install one 48A Level 2 charger in visitor parking. Panel capacity confirmed by customer.',
      6, 2, 'pending', 'low',        interval '4 days 9 hours', null, null, null),

    -- ---- Past (history for KPIs & charts) ----
    ('Grease trap pump-out & inspection', 'Scheduled quarterly grease trap service for kitchen.',
      7, 1, 'completed', 'medium',   interval '-1 day 8 hours', interval '-1 day 8 hours 5 minutes', interval '-1 day 9 hours 20 minutes', 'Trap pumped, baffles intact. Next service in 90 days.'),
    ('Thermostat replacement — 3 zones', 'Replace legacy thermostats with smart programmable units in zones 1–3.',
      2, 3, 'completed', 'low',      interval '-1 day 13 hours', interval '-1 day 13 hours 10 minutes', interval '-1 day 15 hours', 'Installed 3 smart thermostats and set schedules with the manager.'),
    ('Emergency lighting battery test', 'Annual 90-minute test of all emergency lights and exit signs.',
      5, 2, 'completed', 'medium',   interval '-2 days 9 hours', interval '-2 days 9 hours', interval '-2 days 11 hours 30 minutes', '2 exit signs failed — batteries replaced. All units passing.'),
    ('Clogged main drain — Building A', 'Multiple ground-floor units reporting slow drains.',
      4, 1, 'completed', 'urgent',   interval '-2 days 16 hours', interval '-2 days 16 hours 20 minutes', interval '-2 days 18 hours 5 minutes', 'Hydro-jetted main line, root intrusion at cleanout. Recommended camera inspection.'),
    ('Conveyor motor overheating', 'Line 2 conveyor motor tripping thermal overload after ~40 minutes.',
      8, 3, 'completed', 'high',     interval '-3 days 10 hours', interval '-3 days 10 hours 15 minutes', interval '-3 days 13 hours', 'Replaced seized bearing and cleaned motor vents. Ran 2h under load, temps normal.'),
    ('Ice machine not producing', 'Hoshizaki unit in bar area stopped making ice.',
      7, 2, 'completed', 'high',     interval '-4 days 11 hours', interval '-4 days 11 hours 30 minutes', interval '-4 days 12 hours 45 minutes', 'Water inlet valve clogged with scale. Replaced valve, descaled unit.'),
    ('Office reconfiguration — data drops', 'Add 8 Cat6 data drops for new open-plan seating area.',
      6, 1, 'cancelled', 'low',      interval '-5 days 9 hours', null, null, 'Cancelled by customer — project postponed to next quarter.'),
    ('Boiler annual inspection', 'Pre-winter inspection of gas boiler, flue and safety controls.',
      1, 3, 'completed', 'medium',   interval '-6 days 8 hours', interval '-6 days 8 hours 10 minutes', interval '-6 days 10 hours 25 minutes', 'Passed inspection. Cleaned burners, CO readings within spec.')
  ) as w(title, descr, c, t, status, priority, sched, started, completed, notes);

  raise notice 'FieldOps demo data seeded.';
end $$;

-- =============================================================================
-- RESET (run manually to wipe demo data before re-seeding)
-- =============================================================================
-- delete from public.scanned_documents;
-- delete from public.work_order_photos;
-- delete from public.work_orders;
-- delete from public.customers;
-- delete from auth.users where email like '%@fieldops.demo';  -- cascades to profiles/identities
