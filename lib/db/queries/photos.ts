import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseConfigured, env } from "@/lib/env";
import { ymd } from "@/lib/types/habit";

/**
 * FORGE — Hard 75 progress photos.
 *
 * Photos live in a PRIVATE Storage bucket ("progress-photos"). Object keys
 * are namespaced by user id so the storage RLS can fence each user to their
 * own folder:
 *
 *   <user_id>/<enrollment_id>/day-<n>-<ts>.jpg
 *
 * Display always goes through short-lived (1h) signed URLs minted by the
 * service-role client — there are no public URLs. Writes also go through the
 * service-role client (it bypasses storage RLS), but the row insert is done
 * with the user's RLS-scoped client so a user can only attach a photo to
 * their own enrollment.
 */

const BUCKET = "progress-photos";
const SIGNED_TTL = 3600; // 1 hour

export interface ProgressPhoto {
  id: string;
  dayNumber: number | null;
  photoDate: string; // YYYY-MM-DD
  storagePath: string;
  url: string | null; // signed, ~1h
  createdAt: string;
}

interface PhotoRow {
  id: string;
  day_number: number | null;
  photo_date: string;
  storage_path: string;
  created_at: string;
}

/**
 * Every photo attached to an enrollment, oldest day first, each carrying a
 * fresh 1-hour signed URL. Returns [] in demo mode / when unconfigured.
 */
export async function getEnrollmentPhotos(
  enrollmentId: string
): Promise<ProgressPhoto[]> {
  if (!supabaseConfigured) return [];
  const sb = await supabaseServer();
  if (!sb) return [];
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return [];

  const { data: rows } = await sb
    .from("progress_photos")
    .select("id,day_number,photo_date,storage_path,created_at")
    .eq("enrollment_id", enrollmentId)
    .order("day_number", { ascending: true, nullsFirst: false });

  const list = (rows ?? []) as PhotoRow[];
  if (list.length === 0) return [];

  const urlByPath = await signPaths(list.map((r) => r.storage_path));

  return list.map((r) => ({
    id: r.id,
    dayNumber: r.day_number,
    photoDate: r.photo_date,
    storagePath: r.storage_path,
    url: urlByPath.get(r.storage_path) ?? null,
    createdAt: r.created_at,
  }));
}

/**
 * Batch-sign object paths with the service-role client. Falls back to an
 * empty map if the service key isn't set (signed URLs simply come back null,
 * and the UI shows placeholders rather than crashing).
 */
async function signPaths(paths: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (paths.length === 0 || !env.supabaseServiceKey) return out;
  try {
    const admin = supabaseAdmin();
    const { data } = await admin.storage
      .from(BUCKET)
      .createSignedUrls(paths, SIGNED_TTL);
    for (const s of data ?? []) {
      if (s.signedUrl && s.path) out.set(s.path, s.signedUrl);
    }
  } catch {
    // Service key missing or storage hiccup — degrade to placeholders.
  }
  return out;
}

/**
 * Uploads a photo for (enrollment, day): writes the object to the private
 * bucket via the service-role client, records the row (RLS-scoped), and
 * marks the Hard 75 "photo" task complete for today. Overwrites the day's
 * existing photo if one exists (upsert on enrollment_id+day_number).
 */
export async function uploadProgressPhoto(args: {
  enrollmentId: string;
  dayNumber: number;
  bytes: ArrayBuffer;
  contentType: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabaseConfigured) return { ok: true };
  const sb = await supabaseServer();
  if (!sb) return { ok: false, error: "supabase_unavailable" };
  if (!env.supabaseServiceKey) return { ok: false, error: "storage_unavailable" };

  const { data: u } = await sb.auth.getUser();
  if (!u.user) return { ok: false, error: "unauthenticated" };
  const userId = u.user.id;

  // Verify the enrollment belongs to this user before touching storage.
  const { data: enroll } = await sb
    .from("program_enrollments")
    .select("id")
    .eq("id", args.enrollmentId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!enroll) return { ok: false, error: "enrollment_not_found" };

  const ext = extFor(args.contentType);
  const ts = Date.now();
  const path = `${userId}/${args.enrollmentId}/day-${args.dayNumber}-${ts}.${ext}`;

  const admin = supabaseAdmin();

  // Remove any previous object for this (enrollment, day) so we don't orphan
  // storage when overwriting — the row is upserted below.
  const { data: prev } = await sb
    .from("progress_photos")
    .select("storage_path")
    .eq("enrollment_id", args.enrollmentId)
    .eq("day_number", args.dayNumber)
    .maybeSingle();

  const { error: upErr } = await admin.storage
    .from(BUCKET)
    .upload(path, args.bytes, { contentType: args.contentType, upsert: true });
  if (upErr) return { ok: false, error: upErr.message };

  const today = ymd(new Date());
  const { error: rowErr } = await sb.from("progress_photos").upsert(
    {
      user_id: userId,
      enrollment_id: args.enrollmentId,
      day_number: args.dayNumber,
      photo_date: today,
      storage_path: path,
    },
    { onConflict: "enrollment_id,day_number" }
  );
  if (rowErr) {
    // Roll back the just-uploaded object so we don't orphan it.
    await admin.storage.from(BUCKET).remove([path]).catch(() => {});
    return { ok: false, error: rowErr.message };
  }

  // Delete the superseded object (after the row now points at the new one).
  if (prev?.storage_path && prev.storage_path !== path) {
    await admin.storage.from(BUCKET).remove([prev.storage_path]).catch(() => {});
  }

  // Mark the "photo" task complete for today (idempotent).
  await sb.from("program_task_logs").upsert(
    {
      user_id: userId,
      enrollment_id: args.enrollmentId,
      task_key: "photo",
      log_date: today,
    },
    { onConflict: "enrollment_id,task_key,log_date", ignoreDuplicates: true }
  );

  return { ok: true };
}

function extFor(contentType: string): string {
  switch (contentType) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/heic":
      return "heic";
    case "image/jpeg":
    default:
      return "jpg";
  }
}
