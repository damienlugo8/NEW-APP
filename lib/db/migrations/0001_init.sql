-- NotaryFlow — initial schema for Supabase Postgres.
-- Run this in the Supabase SQL editor (or via `supabase db push`).
-- This file is hand-written so the RLS policies live alongside the schema.

-- ─────────────────────────────────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────────────────────────────────
do $$ begin
  create type plan as enum ('free', 'trial', 'solo', 'pro');
exception when duplicate_object then null; end $$;

do $$ begin
  create type sub_status as enum ('trialing', 'active', 'past_due', 'canceled', 'incomplete');
exception when duplicate_object then null; end $$;

do $$ begin
  create type client_type as enum ('title_company', 'signing_service', 'law_firm', 'direct');
exception when duplicate_object then null; end $$;

-- ─────────────────────────────────────────────────────────────────────────
-- profiles — one per auth user
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id                      uuid primary key references auth.users(id) on delete cascade,
  email                   text not null,
  full_legal_name         text,
  business_name           text,
  phone                   text,
  commission_state        text,
  commission_expires_at   date,
  notary_id_number        text,
  onboarded_at            timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles: owner read"   on public.profiles;
drop policy if exists "profiles: owner upsert" on public.profiles;
drop policy if exists "profiles: owner update" on public.profiles;

create policy "profiles: owner read"   on public.profiles for select using (auth.uid() = id);
create policy "profiles: owner upsert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles: owner update" on public.profiles for update using (auth.uid() = id);

-- Auto-create a profile + trial subscription when a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
    on conflict (id) do nothing;
  insert into public.subscriptions (user_id, status, plan, trial_ends_at)
    values (new.id, 'trialing', 'trial', now() + interval '14 days')
    on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────
-- subscriptions
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.subscriptions (
  user_id                 uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id      text unique,
  stripe_subscription_id  text,
  status                  sub_status not null default 'trialing',
  plan                    plan not null default 'trial',
  trial_ends_at           timestamptz,
  current_period_end      timestamptz,
  cancel_at_period_end    boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

drop policy if exists "subs: owner read"   on public.subscriptions;
drop policy if exists "subs: owner update" on public.subscriptions;

create policy "subs: owner read"   on public.subscriptions for select using (auth.uid() = user_id);
create policy "subs: owner update" on public.subscriptions for update using (auth.uid() = user_id);
-- Note: inserts are made by the trigger (security definer); webhook writes
-- via service-role and bypasses RLS.

-- ─────────────────────────────────────────────────────────────────────────
-- Feature tables (no UI yet — schema ready for the upcoming sessions)
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists public.clients (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  company_name text not null,
  contact_name text,
  email        text,
  phone        text,
  type         client_type not null default 'title_company',
  created_at   timestamptz not null default now()
);

create table if not exists public.pipeline_stages (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references auth.users(id) on delete cascade,
  name      text not null,
  position  integer not null
);

create table if not exists public.pipeline_deals (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  client_id            uuid references public.clients(id) on delete set null,
  stage_id             uuid references public.pipeline_stages(id) on delete set null,
  value_estimate_cents integer not null default 0,
  last_contact_at      timestamptz,
  next_action_at       timestamptz,
  notes                text,
  created_at           timestamptz not null default now()
);

create table if not exists public.appointments (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  title         text not null,
  location      text,
  scheduled_at  timestamptz not null,
  duration_min  integer not null default 60,
  fee_cents     integer not null default 0,
  status        text not null default 'scheduled',
  notes         text
);

create table if not exists public.journal_entries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  signer_name   text not null,
  document_type text not null,
  signed_at     timestamptz not null,
  location      text,
  fee_cents     integer not null default 0,
  notes         text
);

create table if not exists public.invoices (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  client_id    uuid references public.clients(id) on delete set null,
  amount_cents integer not null,
  status       text not null default 'draft',
  issued_at    timestamptz,
  paid_at      timestamptz
);

-- ─────────────────────────────────────────────────────────────────────────
-- Standard RLS policies for the feature tables: only the owner sees, writes,
-- and deletes their own rows.
-- ─────────────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'clients',
    'pipeline_stages',
    'pipeline_deals',
    'appointments',
    'journal_entries',
    'invoices'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%1$s: owner read"   on public.%1$I', t);
    execute format('drop policy if exists "%1$s: owner write"  on public.%1$I', t);
    execute format('create policy "%1$s: owner read"  on public.%1$I for select using (auth.uid() = user_id)', t);
    execute format('create policy "%1$s: owner write" on public.%1$I for all    using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
  end loop;
end $$;

-- Helpful indexes
create index if not exists clients_user_idx          on public.clients(user_id);
create index if not exists deals_user_stage_idx      on public.pipeline_deals(user_id, stage_id);
create index if not exists appointments_user_sch_idx on public.appointments(user_id, scheduled_at);
create index if not exists journal_user_signed_idx   on public.journal_entries(user_id, signed_at);
create index if not exists invoices_user_status_idx  on public.invoices(user_id, status);
