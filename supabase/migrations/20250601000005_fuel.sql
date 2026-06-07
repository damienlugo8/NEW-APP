-- FORGE — FUEL (macros + water).
-- Run AFTER 0004_hard75.sql.
--
-- Adds: water_logs (8oz pour increments) + ai_generated flag on meal_logs
-- + target macro columns on profiles. Idempotent.

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Profile target macros — used by /fuel dashboard until onboarding
--    captures them properly. Defaults match the FORGE brief: 180g protein,
--    2400 kcal, one gallon (128 oz) water.
-- ─────────────────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists protein_target_g  integer not null default 180,
  add column if not exists calorie_target    integer not null default 2400,
  add column if not exists water_target_oz   integer not null default 128;

-- ─────────────────────────────────────────────────────────────────────────
-- 2. meal_logs — flag rows that came from Claude vision so the UI can
--    show a small "ai" chip and the user can decide whether to trust them.
-- ─────────────────────────────────────────────────────────────────────────
alter table public.meal_logs
  add column if not exists ai_generated boolean not null default false,
  add column if not exists image_url    text;

-- ─────────────────────────────────────────────────────────────────────────
-- 3. water_logs — one row per 8oz pour. Append + delete (undo). Hitting
--    16 rows in a day = one gallon = auto-completes the Hard 75 water
--    task (handled application-side; this table just stores pours).
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.water_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  log_date    date not null default current_date,
  oz          integer not null default 8 check (oz > 0 and oz <= 64),
  created_at  timestamptz not null default now()
);

create index if not exists water_logs_user_date_idx
  on public.water_logs(user_id, log_date desc);

alter table public.water_logs enable row level security;
drop policy if exists "water_logs: owner read"  on public.water_logs;
drop policy if exists "water_logs: owner write" on public.water_logs;
create policy "water_logs: owner read"  on public.water_logs for select using (auth.uid() = user_id);
create policy "water_logs: owner write" on public.water_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- End of 0005.
