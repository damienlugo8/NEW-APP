-- FORGE — MARKETING LEADS (landing-page email capture).
-- Run AFTER 0008_photos.sql.
--
-- The sticky "FORGE Protocol" banner on the marketing site collects an email
-- in exchange for the 75 Hard guide PDF. Those emails land here BEFORE we try
-- to send the welcome mail via Resend, so a lead is never lost to an email
-- failure. Anonymous visitors must be able to INSERT (they have no session);
-- only authenticated staff may READ the list. Idempotent.

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Table. No user_id — leads are pre-auth. `source` lets us attribute the
--    capture surface (landing-page today, more later). Email is stored raw;
--    validation happens in the server action.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.protocol_leads (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  source     text not null default 'landing-page',
  created_at timestamptz not null default now()
);

-- One row per email is enough; repeat submits are harmless no-ops via upsert.
create unique index if not exists protocol_leads_email_idx
  on public.protocol_leads (lower(email));

-- ─────────────────────────────────────────────────────────────────────────
-- 2. RLS. Insert is open to anon (and authenticated); SELECT is locked to
--    authenticated users only. No update/delete policy => denied for everyone
--    except the service role, which bypasses RLS.
-- ─────────────────────────────────────────────────────────────────────────
alter table public.protocol_leads enable row level security;

drop policy if exists "protocol_leads: anyone can submit" on public.protocol_leads;
create policy "protocol_leads: anyone can submit"
  on public.protocol_leads for insert
  to anon, authenticated
  with check (true);

drop policy if exists "protocol_leads: authenticated can read" on public.protocol_leads;
create policy "protocol_leads: authenticated can read"
  on public.protocol_leads for select
  to authenticated
  using (true);
