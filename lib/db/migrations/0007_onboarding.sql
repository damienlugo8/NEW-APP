-- FORGE — ONBOARDING.
-- Run AFTER 0006_squad.sql.
--
-- The FORGE profile columns already landed in 0003_pivot (display_name,
-- age, height_in, weight_lb, body_fat_pct, primary_goal, starter_program,
-- vices), and the primary_goal enum already carries cut/maintain/bulk/
-- mental. This migration only adds the two starter programs step 5 needs
-- so every option satisfies the profiles.starter_program FK (-> programs.key).
-- Idempotent.

-- ─────────────────────────────────────────────────────────────────────────
-- Starter programs — add Strength Foundations + No-Scroll September so
--    every step-5 card maps to a real programs.key. 75 HARD (hard_75),
--    Monk Mode 30 (monk_mode_30), and Forge Custom (forge_custom) already
--    exist from 0003.
-- ─────────────────────────────────────────────────────────────────────────
insert into public.programs (key, name, duration_days, description, rules) values
  ('strength_foundations', 'Strength Foundations', 90,
   'Twelve weeks of progressive barbell work. Build the base everything else stands on.',
   '{"daily_tasks":["Hit your programmed lift","Eat in your protein target","Sleep 7+ hours","Log the session"],"hard_reset":false}'::jsonb),
  ('no_scroll_september', 'No-Scroll September', 30,
   'Thirty days, zero doomscroll. Reclaim the hours the feed was eating.',
   '{"daily_tasks":["No social media scroll","Phone out of the bedroom","One deep-work block","Read 10 pages"],"hard_reset":false}'::jsonb)
on conflict (key) do update
  set name = excluded.name,
      duration_days = excluded.duration_days,
      description = excluded.description,
      rules = excluded.rules;

-- End of 0007.
