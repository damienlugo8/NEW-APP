-- FORGE — SQUAD (anonymous 5-person accountability rosters).
-- Run AFTER 0005_fuel.sql.
--
-- Schema only. Matchmaking + NPC seeding happen application-side via the
-- service-role client (see lib/db/queries/squad.ts) because squad_members
-- inserts are service-role-gated by the 0003 RLS design.
--
-- Idempotent.

-- ─────────────────────────────────────────────────────────────────────────
-- 1. squad_members — add the SQUAD gameplay columns.
--    anonymous_handle: the two-word identity (IronWolf, SteelHawk). Unique
--      within a squad so leaderboard rows never collide.
--    current_streak / best_streak: synced from the member's discipline data
--      (Hard 75 current_day or DAILY streak) on each /squad load.
--    respect_points: cumulative — +1 each time a squadmate respects you,
--      +5 per 7-day streak milestone (handled app-side).
--    is_seed: true for forged NPC members that fill cold-start rosters.
--    last_active: last date this member logged anything (NULL for seeds is
--      fine — seeds get a synthetic value).
-- ─────────────────────────────────────────────────────────────────────────
alter table public.squad_members
  add column if not exists anonymous_handle text,
  add column if not exists current_streak   integer not null default 0,
  add column if not exists best_streak       integer not null default 0,
  add column if not exists respect_points    integer not null default 0,
  add column if not exists is_seed           boolean not null default false,
  add column if not exists last_active       date;

-- Seed members have no auth user. Relax the FK + PK assumptions by allowing
-- a synthetic member row keyed by a generated uuid in user_id. We DON'T add
-- a real auth.users row for seeds — instead the FK is dropped for this table
-- so seed user_ids can be free uuids. (Real members still reference real
-- users; the app enforces that on insert.)
do $$
begin
  if exists (
    select 1 from pg_constraint
     where conname = 'squad_members_user_id_fkey'
       and conrelid = 'public.squad_members'::regclass
  ) then
    alter table public.squad_members drop constraint squad_members_user_id_fkey;
  end if;
end $$;

create unique index if not exists squad_members_handle_idx
  on public.squad_members(squad_id, anonymous_handle);

-- ─────────────────────────────────────────────────────────────────────────
-- 2. squad_daily_scores — per-member daily completion, for the weekly recap.
--    One row per (squad, member, date). full_day mirrors the Hard 75 "all
--    tasks done" bit; tasks_done is the raw count for partial credit.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.squad_daily_scores (
  id          uuid primary key default gen_random_uuid(),
  squad_id    uuid not null references public.squads(id) on delete cascade,
  user_id     uuid not null,
  score_date  date not null,
  tasks_done  integer not null default 0,
  full_day    boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (squad_id, user_id, score_date)
);

create index if not exists sds_squad_date_idx
  on public.squad_daily_scores(squad_id, score_date desc);

alter table public.squad_daily_scores enable row level security;
drop policy if exists "sds: squad member read" on public.squad_daily_scores;
create policy "sds: squad member read" on public.squad_daily_scores for select using (
  exists (
    select 1 from public.squad_members sm
     where sm.squad_id = squad_daily_scores.squad_id
       and sm.user_id = auth.uid()
  )
);
-- Writes happen via service-role only.

-- ─────────────────────────────────────────────────────────────────────────
-- 3. callouts — the ONLY interaction. A member calls out a squadmate to
--    hit S-tier this week. Recipient sees it as a notification banner.
--    No chat, no threads, no likes. One row per callout.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.callouts (
  id            uuid primary key default gen_random_uuid(),
  squad_id      uuid not null references public.squads(id) on delete cascade,
  from_user_id  uuid not null references auth.users(id) on delete cascade,
  to_user_id    uuid not null,                 -- may be a seed uuid
  to_handle     text not null,
  message       text not null,
  seen          boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists callouts_to_idx
  on public.callouts(to_user_id, created_at desc);
create index if not exists callouts_squad_idx
  on public.callouts(squad_id, created_at desc);

alter table public.callouts enable row level security;
drop policy if exists "callouts: recipient read" on public.callouts;
drop policy if exists "callouts: author read"    on public.callouts;
drop policy if exists "callouts: author write"   on public.callouts;
drop policy if exists "callouts: recipient seen" on public.callouts;
create policy "callouts: recipient read" on public.callouts for select using (auth.uid() = to_user_id);
create policy "callouts: author read"    on public.callouts for select using (auth.uid() = from_user_id);
create policy "callouts: author write"   on public.callouts for insert with check (auth.uid() = from_user_id);
create policy "callouts: recipient seen" on public.callouts for update
  using (auth.uid() = to_user_id) with check (auth.uid() = to_user_id);

-- End of 0006.
