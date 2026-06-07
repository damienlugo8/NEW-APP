-- FORGE — BILLING ON PROFILES (Stripe source of truth).
-- Run AFTER 0010_notifications.sql.
--
-- The Stripe webhook writes plan/billing state directly onto the user's
-- profile row, which is the single place the app reads subscription state
-- from (the older `subscriptions` table is no longer the read path). Adding
-- the columns here keeps the webhook a pure UPDATE. Idempotent.

alter table public.profiles
  add column if not exists stripe_customer_id     text,
  add column if not exists stripe_subscription_id text,
  add column if not exists current_period_end     timestamptz,
  add column if not exists plan                    text not null default 'free';

-- Fast lookup by Stripe customer id — the webhook maps subscription.updated /
-- .deleted events (which only carry the customer) back to a user this way.
create index if not exists profiles_stripe_customer_idx
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;
