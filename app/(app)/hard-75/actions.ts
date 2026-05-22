"use server";

import { revalidatePath } from "next/cache";
import {
  toggleHard75Task,
  hardResetEnrollment,
  completeEnrollment,
  enrollInHard75,
} from "@/lib/db/queries/hard75";
import type { Hard75TaskKey } from "@/lib/types/hard75";

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
