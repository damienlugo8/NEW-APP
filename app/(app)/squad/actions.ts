"use server";

import { revalidatePath } from "next/cache";
import {
  joinOrCreateSquad,
  sendCallout,
  grantRespect,
  markCalloutsSeen,
} from "@/lib/db/queries/squad";

/**
 * /squad server actions. Thin wrappers around the squad query helpers;
 * optimistic UI lives on the client. Every successful mutation revalidates
 * /squad so the leaderboard, respect totals, and callout feed re-read.
 */

export async function joinSquadAction(): Promise<{
  ok: boolean;
  error?: string;
}> {
  const res = await joinOrCreateSquad();
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath("/squad");
  return { ok: true };
}

export async function calloutAction(
  toUserId: string,
  toHandle: string,
  message: string
): Promise<{ ok: boolean; error?: string }> {
  const trimmed = message.trim();
  if (!trimmed) return { ok: false, error: "Say something first." };
  const res = await sendCallout(toUserId, toHandle, trimmed.slice(0, 140));
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath("/squad");
  return { ok: true };
}

export async function respectAction(
  toUserId: string
): Promise<{ ok: boolean; error?: string }> {
  const res = await grantRespect(toUserId);
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath("/squad");
  return { ok: true };
}

export async function seenCalloutsAction(): Promise<void> {
  await markCalloutsSeen();
  revalidatePath("/squad");
}
