-- FORGE — pivot migration. Drops the notary domain, reshapes profiles,
-- adds the FORGE domain tables (habits, programs, squads, etc).
--
-- Run AFTER 0001_init.sql and 0002_features.sql.
-- This migration IS destructive: it drops journal_entries, appointments,
-- contacts, contact_activities, clients, pipeline_stages, pipeline_deals,
-- and invoices. A git commit on the notary state lands before this runs.
--
-- Idempotent: every CREATE uses IF NOT EXISTS; every ALTER uses IF EXISTS
-- guards; enum value adds use IF NOT EXISTS. Safe to re-run.

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Tear down notary tables
-- ─────────────────────────────────────────────────────────────────────────
drop trigger if exists on_activity_inserted on public.contact_activities;
drop function if exists public.bump_last_contacted();

drop table if exists public.contact_activities cascade;
drop table if exists public.contacts           cascade;
drop table if exists public.journal_entries    cascade;
drop table if exists public.appointments       cascade;
drop table if exists public.pipeline_deals     cascade;
drop table if exists public.pipeline_stages    cascade;
drop table if exists public.invoices           cascade;
drop table if exists public.clients            cascade;

-- Drop notary enums that no longer have a reference
drop type if exists contact_stage      cascade;
drop type if exists activity_type      cascade;
drop type if exists appointment_status cascade;
drop type if exists client_type        cascade;

-- ─────────────────────────────────────────────────────────────────────────
-- 2. New enums
-- ─────────────────────────────────────────────────────────────────────────
do $$ begin
  create type primary_goal as enum ('cut','maintain','bulk','mental','financial');
exception when duplicate_object then null; end $$;

do $$ begin
  create type program_status as enum ('active','completed','failed','abandoned');
exception when duplicate_object then null; end $$;

-- Add 'lifetime' to the plan enum (Stripe one-time purchase tier).
alter type plan add value if not exists 'lifetime';

-- ─────────────────────────────────────────────────────────────────────────
-- 3. Reshape profiles — drop notary columns, add FORGE columns
-- ─────────────────────────────────────────────────────────────────────────
alter table public.profiles
  drop column if exists full_legal_name,
  drop column if exists business_name,
  drop column if exists commission_state,
  drop column if exists commission_expires_at,
  drop column if exists notary_id_number;

alter table public.profiles
  add column if not exists display_name             text,
  add column if not exists age                      integer,
  add column if not exists height_in                integer,
  add column if not exists weight_lb                integer,
  add column if not exists body_fat_pct             integer,
  add column if not exists primary_goal             primary_goal,
  add column if not exists starter_program          text,
  add column if not exists vices                    text[],
  add column if not exists apple_health_connected   boolean not null default false,
  add column if not exists squad_handle             text unique;

-- ─────────────────────────────────────────────────────────────────────────
-- 4. Programs — reference data, system-managed.
--    Hard 75 is the wedge; Monk Mode 30 and Forge Custom round it out.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.programs (
  key            text primary key,
  name           text not null,
  duration_days  integer not null,
  description    text,
  rules          jsonb,
  created_at     timestamptz not null default now()
);

-- Reference table — readable by everyone, writable by no one (managed via
-- migrations). RLS still enabled so the policy is explicit.
alter table public.programs enable row level security;
drop policy if exists "programs: public read" on public.programs;
create policy "programs: public read" on public.programs for select using (true);

-- Seed the three launch programs. ON CONFLICT keeps re-runs idempotent.
insert into public.programs (key, name, duration_days, description, rules) values
  ('hard_75',     'Hard 75',     75,
   'Five daily tasks for 75 consecutive days. Miss one — start over at day 1.',
   '{"daily_tasks":["Two 45-min workouts (one outdoor)","Follow a diet, no cheat meals","No alcohol","Drink one gallon of water","Read 10 pages of nonfiction","Take a progress photo"],"hard_reset":true}'::jsonb),
  ('monk_mode_30','Monk Mode 30', 30,
   '30 days of deep focus: no porn, no social scroll, no junk food, daily training.',
   '{"daily_tasks":["No porn","No social media scroll","No junk food","Train daily","Read 30 min"],"hard_reset":false}'::jsonb),
  ('forge_custom','Forge Custom', 90,
   'You define the rules. We track them.',
   '{"daily_tasks":[],"hard_reset":false}'::jsonb)
on conflict (key) do update
  set name = excluded.name,
      duration_days = excluded.duration_days,
      description = excluded.description,
      rules = excluded.rules;

-- Link profiles.starter_program → programs.key (deferred FK so the column
-- could be added before programs existed at insert time).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_starter_program_fkey'
  ) then
    alter table public.profiles
      add constraint profiles_starter_program_fkey
      foreign key (starter_program) references public.programs(key) on delete set null;
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────────────────
-- 5. Habits + habit_logs — the DAILY tab's core data
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.habits (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  habit_key    text not null,
  label        text not null,
  icon         text,
  sort_order   integer not null default 0,
  archived_at  timestamptz,
  created_at   timestamptz not null default now(),
  unique (user_id, habit_key)
);

create index if not exists habits_user_active_idx
  on public.habits(user_id, sort_order) where archived_at is null;

create table if not exists public.habit_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  habit_id     uuid not null references public.habits(id) on delete cascade,
  log_date     date not null,
  created_at   timestamptz not null default now(),
  unique (user_id, habit_id, log_date)
);

create index if not exists habit_logs_user_date_idx
  on public.habit_logs(user_id, log_date desc);

-- ─────────────────────────────────────────────────────────────────────────
-- 6. Program enrollments — one row per (user, program, attempt).
--    Hard 75 hard-reset bumps `hard_resets` and resets `started_at` and
--    `current_day` — we keep the same row so the count is durable.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.program_enrollments (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  program_key  text not null references public.programs(key) on delete cascade,
  started_at   date not null default current_date,
  current_day  integer not null default 1,
  hard_resets  integer not null default 0,
  status       program_status not null default 'active',
  completed_at date,
  failed_at    date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists enrollments_user_active_idx
  on public.program_enrollments(user_id, status);

-- ─────────────────────────────────────────────────────────────────────────
-- 7. Meal logs — FUEL tab. Append-only (journal pattern).
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.meal_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  logged_at     timestamptz not null default now(),
  meal_name     text not null,
  calories      integer,
  protein_g     integer,
  carbs_g       integer,
  fat_g         integer,
  source_image  text,          -- storage path; cleared after analysis
  notes         text
);

create index if not exists meal_logs_user_date_idx
  on public.meal_logs(user_id, logged_at desc);

-- ─────────────────────────────────────────────────────────────────────────
-- 8. Progress photos — FUEL / Hard 75. Append-only.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.progress_photos (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  photo_date   date not null default current_date,
  storage_path text not null,
  weight_lb    integer,
  notes        text,
  created_at   timestamptz not null default now()
);

create index if not exists progress_photos_user_date_idx
  on public.progress_photos(user_id, photo_date desc);

-- ─────────────────────────────────────────────────────────────────────────
-- 9. Squads — 5-person anonymous rosters
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.squads (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table if not exists public.squad_members (
  squad_id   uuid not null references public.squads(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (squad_id, user_id)
);

create index if not exists squad_members_user_idx on public.squad_members(user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- 10. Respect grants — anonymous +1s between squad members
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.respect_grants (
  id            uuid primary key default gen_random_uuid(),
  from_user_id  uuid not null references auth.users(id) on delete cascade,
  to_user_id    uuid not null references auth.users(id) on delete cascade,
  grant_date    date not null default current_date,
  created_at    timestamptz not null default now(),
  unique (from_user_id, to_user_id, grant_date),
  check (from_user_id <> to_user_id)
);

create index if not exists respect_to_idx on public.respect_grants(to_user_id, grant_date desc);

-- ─────────────────────────────────────────────────────────────────────────
-- 11. Referrals — invite codes for the lifetime tier
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.referrals (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  code             text not null unique,
  used_by_user_id  uuid references auth.users(id) on delete set null,
  used_at          timestamptz,
  created_at       timestamptz not null default now()
);

create index if not exists referrals_user_idx on public.referrals(user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- 12. Email subscribers — lead magnet, no auth required
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.email_subscribers (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  source      text,
  created_at  timestamptz not null default now()
);

alter table public.email_subscribers enable row level security;
drop policy if exists "subscribers: anyone insert" on public.email_subscribers;
create policy "subscribers: anyone insert"
  on public.email_subscribers for insert with check (true);
-- No select policy — readable only via service-role.

-- ─────────────────────────────────────────────────────────────────────────
-- 13. RLS policies for the owner-scoped tables
-- ─────────────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'habits',
    'habit_logs',
    'program_enrollments',
    'progress_photos'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%1$s: owner read"  on public.%1$I', t);
    execute format('drop policy if exists "%1$s: owner write" on public.%1$I', t);
    execute format('create policy "%1$s: owner read"  on public.%1$I for select using (auth.uid() = user_id)', t);
    execute format('create policy "%1$s: owner write" on public.%1$I for all    using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
  end loop;
end $$;

-- meal_logs is append-only — owner reads + owner inserts, no update/delete
alter table public.meal_logs enable row level security;
drop policy if exists "meal_logs: owner select" on public.meal_logs;
drop policy if exists "meal_logs: owner insert" on public.meal_logs;
create policy "meal_logs: owner select" on public.meal_logs
  for select using (auth.uid() = user_id);
create policy "meal_logs: owner insert" on public.meal_logs
  for insert with check (auth.uid() = user_id);

-- progress_photos — owner reads + owner inserts, no update/delete on the
-- record (the image itself can be deleted via storage policies; the row
-- stays as a timeline anchor).
alter table public.progress_photos enable row level security;
drop policy if exists "progress_photos: owner read"  on public.progress_photos;
drop policy if exists "progress_photos: owner write" on public.progress_photos;
drop policy if exists "progress_photos: owner select" on public.progress_photos;
drop policy if exists "progress_photos: owner insert" on public.progress_photos;
create policy "progress_photos: owner select" on public.progress_photos
  for select using (auth.uid() = user_id);
create policy "progress_photos: owner insert" on public.progress_photos
  for insert with check (auth.uid() = user_id);

-- squads — readable to members only; writable only via service-role
alter table public.squads enable row level security;
drop policy if exists "squads: member read" on public.squads;
create policy "squads: member read" on public.squads for select using (
  exists (select 1 from public.squad_members sm
          where sm.squad_id = id and sm.user_id = auth.uid())
);

alter table public.squad_members enable row level security;
drop policy if exists "squad_members: self read"    on public.squad_members;
drop policy if exists "squad_members: peer read"    on public.squad_members;
drop policy if exists "squad_members: self leave"   on public.squad_members;
create policy "squad_members: peer read" on public.squad_members for select using (
  exists (select 1 from public.squad_members me
          where me.squad_id = squad_id and me.user_id = auth.uid())
);
create policy "squad_members: self leave" on public.squad_members for delete using (
  auth.uid() = user_id
);
-- Inserts happen via service-role match function (TBD).

-- respect_grants — author can read their own; recipient can read theirs.
alter table public.respect_grants enable row level security;
drop policy if exists "respect: author read"    on public.respect_grants;
drop policy if exists "respect: recipient read" on public.respect_grants;
drop policy if exists "respect: author write"   on public.respect_grants;
create policy "respect: author read"
  on public.respect_grants for select using (auth.uid() = from_user_id);
create policy "respect: recipient read"
  on public.respect_grants for select using (auth.uid() = to_user_id);
create policy "respect: author write"
  on public.respect_grants for insert with check (auth.uid() = from_user_id);

-- referrals — owner-only
alter table public.referrals enable row level security;
drop policy if exists "referrals: owner read"  on public.referrals;
drop policy if exists "referrals: owner write" on public.referrals;
create policy "referrals: owner read"  on public.referrals for select using (auth.uid() = user_id);
create policy "referrals: owner write" on public.referrals for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- 14. Default habit seed — fires on first habit list request from a user
--     who has no habits. Implemented as a function so the app can call it
--     explicitly on /daily first-load; safer than a trigger that would
--     fire on every signup before the user has chosen anything.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.seed_default_habits(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.habits where user_id = p_user) then
    return;
  end if;
  insert into public.habits (user_id, habit_key, label, icon, sort_order) values
    (p_user, 'gym',             'Gym',              'Dumbbell',   1),
    (p_user, 'read',            'Read 10 pages',    'BookOpen',   2),
    (p_user, 'no_scroll',       'No scroll',        'PhoneOff',   3),
    (p_user, 'cold_shower',     'Cold shower',      'Snowflake',  4),
    (p_user, 'no_nicotine',     'No nicotine',      'Ban',        5),
    (p_user, 'no_porn',         'No porn',          'EyeOff',     6),
    (p_user, 'hydrate',         'One gallon water', 'GlassWater', 7),
    (p_user, 'outdoor_workout', 'Outdoor workout',  'Mountain',   8);
end;
$$;

-- End of pivot.
