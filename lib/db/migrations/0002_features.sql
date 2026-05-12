-- NotaryFlow — session 2 schema: appointments+, journal+, contacts, activities.
-- Run AFTER 0001_init.sql.
-- This migration is additive and idempotent — safe to re-run.

-- ─────────────────────────────────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────────────────────────────────
do $$ begin
  create type contact_stage as enum (
    'prospect', 'contacted', 'following_up', 'active_client', 'inactive'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type activity_type as enum ('email', 'call', 'meeting', 'note');
exception when duplicate_object then null; end $$;

do $$ begin
  create type appointment_status as enum ('scheduled', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

-- ─────────────────────────────────────────────────────────────────────────
-- appointments — extend with structured location + client + document type.
-- ─────────────────────────────────────────────────────────────────────────
alter table public.appointments
  add column if not exists client_name       text,
  add column if not exists location_address  text,
  add column if not exists location_city     text,
  add column if not exists location_state    text,
  add column if not exists location_zip      text,
  add column if not exists document_type     text;

-- Convert status to enum if it's still text (idempotent).
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'appointments'
      and column_name = 'status' and data_type = 'text'
  ) then
    alter table public.appointments
      alter column status drop default,
      alter column status type appointment_status using status::appointment_status,
      alter column status set default 'scheduled'::appointment_status;
  end if;
end $$;

-- Make `title` nullable since we derive it from document_type + client_name.
alter table public.appointments alter column title drop not null;

-- ─────────────────────────────────────────────────────────────────────────
-- journal_entries — expand to a legally-relevant record.
-- ─────────────────────────────────────────────────────────────────────────
alter table public.journal_entries
  add column if not exists appointment_id     uuid references public.appointments(id) on delete set null,
  add column if not exists signer_address     text,
  add column if not exists id_type            text,
  add column if not exists id_number_last4    text,
  add column if not exists id_issuing_state   text,
  add column if not exists witness_name       text,
  add column if not exists signature_svg      text,
  add column if not exists fee_charged_cents  integer;

-- Backfill fee_charged_cents from old fee_cents if present.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='journal_entries' and column_name='fee_cents'
  ) then
    update public.journal_entries
      set fee_charged_cents = coalesce(fee_charged_cents, fee_cents)
      where fee_charged_cents is null;
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────────────────
-- Journal immutability: only INSERT + SELECT allowed. No UPDATE / DELETE.
-- This is enforced at the DB so app bugs cannot violate it.
-- ─────────────────────────────────────────────────────────────────────────
alter table public.journal_entries enable row level security;

drop policy if exists "journal_entries: owner read"   on public.journal_entries;
drop policy if exists "journal_entries: owner write"  on public.journal_entries;
drop policy if exists "journal_entries: owner insert" on public.journal_entries;
drop policy if exists "journal_entries: owner select" on public.journal_entries;

create policy "journal_entries: owner select"
  on public.journal_entries
  for select using (auth.uid() = user_id);

create policy "journal_entries: owner insert"
  on public.journal_entries
  for insert with check (auth.uid() = user_id);

-- Intentionally NO update / delete policies. Append-only.

-- ─────────────────────────────────────────────────────────────────────────
-- contacts — the pipeline's core table. Replaces v1 `clients`.
-- We keep the old `clients` table for backward compat but the app reads/writes `contacts`.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.contacts (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  company_name        text not null,
  contact_name        text,
  contact_role        text,
  phone               text,
  email               text,
  address             text,
  stage               contact_stage not null default 'prospect',
  notes               text,
  last_contacted_at   timestamptz,
  next_followup_at    timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists contacts_user_stage_idx     on public.contacts(user_id, stage);
create index if not exists contacts_user_followup_idx  on public.contacts(user_id, next_followup_at);

alter table public.contacts enable row level security;
drop policy if exists "contacts: owner read"  on public.contacts;
drop policy if exists "contacts: owner write" on public.contacts;
create policy "contacts: owner read"  on public.contacts for select using (auth.uid() = user_id);
create policy "contacts: owner write" on public.contacts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- contact_activities — one row per touch.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.contact_activities (
  id              uuid primary key default gen_random_uuid(),
  contact_id      uuid not null references public.contacts(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  activity_type   activity_type not null,
  activity_date   timestamptz not null default now(),
  summary         text
);

create index if not exists activities_contact_idx on public.contact_activities(contact_id, activity_date desc);
create index if not exists activities_user_idx    on public.contact_activities(user_id, activity_date desc);

alter table public.contact_activities enable row level security;
drop policy if exists "activities: owner read"  on public.contact_activities;
drop policy if exists "activities: owner write" on public.contact_activities;
create policy "activities: owner read"  on public.contact_activities for select using (auth.uid() = user_id);
create policy "activities: owner write" on public.contact_activities for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- Convenience: keep contacts.last_contacted_at in sync when an activity is
-- inserted. Simpler than a join on every contact list query.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.bump_last_contacted()
returns trigger
language plpgsql
as $$
begin
  update public.contacts
     set last_contacted_at = greatest(coalesce(last_contacted_at, 'epoch'::timestamptz), new.activity_date),
         updated_at = now()
   where id = new.contact_id and user_id = new.user_id;
  return new;
end;
$$;

drop trigger if exists on_activity_inserted on public.contact_activities;
create trigger on_activity_inserted
  after insert on public.contact_activities
  for each row execute procedure public.bump_last_contacted();
