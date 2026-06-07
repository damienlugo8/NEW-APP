-- FORGE — PROGRESS PHOTOS (Hard 75 daily documentation).
-- Run AFTER 0007_onboarding.sql.
--
-- The Hard 75 "photo" task was trust-based ("storage in v1.1"). This ships
-- v1.1. progress_photos already exists from 0003 (id, user_id, photo_date,
-- storage_path, weight_lb, notes, created_at) — we extend it with the Hard
-- 75 linkage rather than recreate, and add a PRIVATE Storage bucket. Photos
-- are never public — display happens through 1-hour signed URLs generated
-- server-side. Idempotent.

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Extend progress_photos with the Hard 75 enrollment linkage. We keep the
--    existing storage_path column as the object key inside the private
--    bucket. day_number is the Hard 75 day the photo documents.
-- ─────────────────────────────────────────────────────────────────────────
alter table public.progress_photos
  add column if not exists enrollment_id uuid references public.program_enrollments(id) on delete cascade,
  add column if not exists day_number    integer;

create index if not exists progress_photos_enrollment_idx
  on public.progress_photos(enrollment_id, day_number);

-- One photo per (enrollment, day). Partial so legacy rows with no enrollment
-- linkage don't collide.
create unique index if not exists progress_photos_enroll_day_idx
  on public.progress_photos(enrollment_id, day_number)
  where enrollment_id is not null;

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Storage bucket — private. public=false means no anonymous public URLs;
--    the app reads via signed URLs that expire in 1 hour.
-- ─────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
  values ('progress-photos', 'progress-photos', false)
  on conflict (id) do update set public = false;

-- ─────────────────────────────────────────────────────────────────────────
-- 3. Storage RLS — defense in depth. Object keys are namespaced by user id:
--    "<user_id>/<enrollment_id>/day-<n>-<ts>.jpg". A user can only touch
--    objects under their own top-level folder. (App writes go through the
--    service-role client, which bypasses these — but a leaked anon token
--    still can't read another user's photos.)
-- ─────────────────────────────────────────────────────────────────────────
drop policy if exists "progress-photos: owner read"   on storage.objects;
drop policy if exists "progress-photos: owner insert" on storage.objects;
drop policy if exists "progress-photos: owner update" on storage.objects;
drop policy if exists "progress-photos: owner delete" on storage.objects;

create policy "progress-photos: owner read" on storage.objects for select using (
  bucket_id = 'progress-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "progress-photos: owner insert" on storage.objects for insert with check (
  bucket_id = 'progress-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "progress-photos: owner update" on storage.objects for update using (
  bucket_id = 'progress-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "progress-photos: owner delete" on storage.objects for delete using (
  bucket_id = 'progress-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- End of 0008.
