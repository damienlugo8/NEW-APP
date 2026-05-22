"use server";

import { revalidatePath } from "next/cache";
import {
  toggleHabitToday,
  startProgram as startProgramQuery,
} from "@/lib/db/queries/habits";
import type { ProgramKey } from "@/lib/types/habit";

/**
 * Server actions for the DAILY tab. Thin wrappers that delegate to the
 * query layer and revalidate the page on success so the next render shows
 * the canonical server state (the client also keeps an optimistic copy so
 * the tap feels instant — see daily-client.tsx).
 */

export async function toggleHabitAction(
  habitId: string,
  nextCompleted: boolean
): Promise<{ ok: boolean; error?: string }> {
  const res = await toggleHabitToday(habitId, nextCompleted);
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath("/daily");
  return { ok: true };
}

export async function startProgramAction(
  programKey: ProgramKey
): Promise<{ ok: boolean; error?: string }> {
  const res = await startProgramQuery(programKey);
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath("/daily");
  return { ok: true };
}
