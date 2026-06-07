"use server";

import { revalidatePath } from "next/cache";
import {
  toggleHard75Task,
  hardResetEnrollment,
  completeEnrollment,
  enrollInHard75,
} from "@/lib/db/queries/hard75";
import { uploadProgressPhoto } from "@/lib/db/queries/photos";
import type { Hard75TaskKey } from "@/lib/types/hard75";

const MAX_PHOTO_BYTES = 12 * 1024 * 1024; // 12 MB
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
]);

/**
 * /hard-75 server actions. Thin wrappers; the optimistic UI lives on the
 * client (hard-75-client.tsx). Every successful mutation revalidates the
 * page so the next render syncs with the canonical server state.
 */

export async function toggleTaskAction(
  enrollmentId: string,
  taskKey: Hard75TaskKey,
  next: boolean
): Promise<{ ok: boolean; error?: string }> {
  const res = await toggleHard75Task(enrollmentId, taskKey, next);
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath("/hard-75");
  return { ok: true };
}

export async function hardResetAction(
  enrollmentId: string
): Promise<{ ok: boolean; error?: string }> {
  const res = await hardResetEnrollment(enrollmentId);
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath("/hard-75");
  return { ok: true };
}

export async function completeAction(
  enrollmentId: string
): Promise<{ ok: boolean; error?: string }> {
  const res = await completeEnrollment(enrollmentId);
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath("/hard-75");
  revalidatePath("/hard-75/receipt");
  return { ok: true };
}

/**
 * Uploads today's progress photo. The client posts a FormData with the raw
 * File plus the enrollment id and day number. We validate type/size, hand
 * the bytes to the storage layer (which writes to the private bucket, records
 * the row, and auto-completes the "photo" task), then revalidate.
 */
export async function uploadPhotoAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const file = formData.get("file");
  const enrollmentId = String(formData.get("enrollmentId") ?? "");
  const dayNumber = Number(formData.get("dayNumber"));

  if (!enrollmentId || !Number.isFinite(dayNumber) || dayNumber < 1) {
    return { ok: false, error: "Missing photo context." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "No photo selected." };
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return { ok: false, error: "Use a JPG, PNG, WEBP, or HEIC image." };
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return { ok: false, error: "Photo is too large (max 12 MB)." };
  }

  const bytes = await file.arrayBuffer();
  const res = await uploadProgressPhoto({
    enrollmentId,
    dayNumber,
    bytes,
    contentType: file.type,
  });
  if (!res.ok) return { ok: false, error: res.error };

  revalidatePath("/hard-75");
  revalidatePath("/hard-75/receipt");
  return { ok: true };
}

export async function enrollAction(): Promise<{
  ok: boolean;
  error?: string;
}> {
  const res = await enrollInHard75();
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath("/hard-75");
  revalidatePath("/daily");
  return { ok: true };
}
