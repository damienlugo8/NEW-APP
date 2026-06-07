-- FORGE — Hard 75 program task tracking.
-- Run AFTER 0003_pivot.sql.
-- Adds a single domain table (program_task_logs) that records the six
-- per-day completions for a Hard 75 (or any program) enrollment, plus a
-- helper view for computing "did the user finish that day" without a
-- round-trip per row.
--
-- Why a dedicated table and not habit_logs:
--   habit_logs is the user's META-discipline track (custom habits). A
--   program is a fixed contract — six tasks every day for 75 days —
--   so the data shape is naturally enrollment-scoped, not habit-scoped.
--   This keeps DAILY and Hard 75 parallel; archiving a habit doesn't
--   destroy program history, and completing a Hard 75 day doesn't
--   inflate the user's habit streak.

-- ─────────────────────────────────────────────────────────────────────────
-- 1. program_task_logs — one row per (enrollment, task, day) completion
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.program_task_logs (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  enrollment_id  uuid not null references public.program_enrollments(id) on delete cascade,
  task_key       text not null,             -- 'workout_indoor', 'workout_outdoor',
                                            --  'diet', 'no_alcohol', 'water',
                                            --  'read', 'photo'
  log_date       date not null,
  created_at     timestamptz not null default now(),
  unique (enrollment_id, task_key, log_date)
);

create index if not exists ptl_user_date_idx
  on public.program_task_logs(user_id, log_date desc);
create index if not exists ptl_enrollment_date_idx
  on public.program_task_logs(enrollment_id, log_date desc);

alter table public.program_task_logs enable row level security;
drop policy if exists "ptl: owner read"  on public.program_task_logs;
drop policy if exists "ptl: owner write" on public.program_task_logs;
create policy "ptl: owner read"  on public.program_task_logs for select using (auth.uid() = user_id);
create policy "ptl: owner write" on public.program_task_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- 2. hard_reset(uuid) — the brutal honesty function.
--
-- Called when a user explicitly hits "I missed a task — reset me to Day 1."
-- Bumps hard_resets, resets started_at to today, and current_day to 1.
-- Past task_logs are kept (history is sacred — you reset, you don't erase).
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.hard_reset_enrollment(p_enrollment uuid)
returns public.program_enrollments
language plpgsql
security definer
set search_path = public
as $$
declare
  e public.program_enrollments;
begin
  select * into e from public.program_enrollments
   where id = p_enrollment and user_id = auth.uid() and status = 'active'
   for update;
  if not found then
    raise exception 'enrollment_not_found_or_not_owned';
  end if;

  update public.program_enrollments
     set hard_resets = hard_resets + 1,
         started_at  = current_date,
         current_day = 1,
         updated_at  = now()
   where id = p_enrollment
  returning * into e;

  return e;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- 3. complete_enrollment(uuid) — called from the app when current_day = 75
--     and today's task count = 6 (server-verified). Marks the program
--     completed with today's date so the Day-75 Receipt can render.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.complete_enrollment(p_enrollment uuid)
returns public.program_enrollments
language plpgsql
security definer
set search_path = public
as $$
declare
  e public.program_enrollments;
  task_count int;
  program_duration int;
begin
  -- Postgres rejects a record + scalar in the same INTO list, so we fetch
  -- the enrollment row first, then look up the program duration separately.
  select * into e
    from public.program_enrollments
   where id = p_enrollment
     and user_id = auth.uid()
     and status = 'active'
   for update;
  if not found then
    raise exception 'enrollment_not_found_or_not_owned';
  end if;

  select duration_days into program_duration
    from public.programs where key = e.program_key;

  -- Server-side verification: today's task count must match.
  select count(*) into task_count
    from public.program_task_logs
   where enrollment_id = p_enrollment
     and log_date = current_date;

  if task_count < 6 then
    raise exception 'tasks_incomplete';
  end if;

  if e.current_day < program_duration then
    raise exception 'too_early';
  end if;

  update public.program_enrollments
     set status = 'completed',
         completed_at = current_date,
         updated_at = now()
   where id = p_enrollment
  returning * into e;

  return e;
end;
$$;

-- End of 0004.
