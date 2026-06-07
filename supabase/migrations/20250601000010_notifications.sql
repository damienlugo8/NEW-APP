-- FORGE — NOTIFICATION PREFERENCES.
-- Run AFTER 0009_leads.sql.
--
-- The settings page exposes three email toggles. We store them as a single
-- JSON blob on profiles so adding a future channel is a code change, not a
-- migration. Existing rows backfill to "all on" — the sensible default for a
-- discipline app (you opted in by signing up). Idempotent.

alter table public.profiles
  add column if not exists notifications_prefs jsonb not null
  default '{"daily_checkin": true, "squad_alerts": true, "streak_milestones": true}'::jsonb;

-- Backfill any rows that predate the default (defensive — `add column` with a
-- default already populates existing rows, but this keeps re-runs honest).
update public.profiles
  set notifications_prefs = '{"daily_checkin": true, "squad_alerts": true, "streak_milestones": true}'::jsonb
  where notifications_prefs is null;
