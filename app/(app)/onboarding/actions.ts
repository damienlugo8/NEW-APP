"use server";

import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import { joinOrCreateSquad } from "@/lib/db/queries/squad";

/**
 * Onboarding — FORGE. Persists the wizard payload to profiles and, if the
 * user opted in, drops them into a squad. The wizard owns all step state
 * client-side and calls this once at the end with a typed payload (no
 * FormData parsing — arrays survive cleanly).
 *
 * Column map (all landed in 0003_pivot):
 *   first_name  -> display_name
 *   goal        -> primary_goal   (enum)
 *   program     -> starter_program (FK -> programs.key)
 *   vices       -> vices          (text[])
 */

const schema = z.object({
  first_name: z.string().trim().min(1, "Tell us your name.").max(40),
  age: z.number().int().min(13).max(100).nullable(),
  height_in: z.number().int().min(36).max(96).nullable(),
  weight_lb: z.number().int().min(60).max(700).nullable(),
  body_fat_pct: z.number().int().min(2).max(70).nullable(),
  goal: z.enum(["cut", "bulk", "maintain", "mental"]).nullable(),
  vices: z.array(
    z.enum([
      "phone_scrolling",
      "porn",
      "nicotine",
      "alcohol",
      "junk_food",
      "oversleeping",
      "negative_self_talk",
    ])
  ),
  program: z
    .enum([
      "hard_75",
      "monk_mode_30",
      "strength_foundations",
      "no_scroll_september",
      "forge_custom",
    ])
    .nullable(),
  join_squad: z.boolean(),
});

export type OnboardingPayload = z.infer<typeof schema>;

export async function completeOnboarding(
  payload: OnboardingPayload
): Promise<{ ok: boolean; error?: string }> {
  if (!supabaseConfigured) {
    // Demo mode: nothing to persist; the client routes to /daily.
    return { ok: true };
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;

  const sb = await supabaseServer();
  if (!sb) return { ok: false, error: "Auth not configured." };
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return { ok: false, error: "Not signed in." };

  const { error } = await sb.from("profiles").upsert({
    id: u.user.id,
    email: u.user.email,
    display_name: data.first_name,
    age: data.age,
    height_in: data.height_in,
    weight_lb: data.weight_lb,
    body_fat_pct: data.body_fat_pct,
    primary_goal: data.goal,
    vices: data.vices,
    starter_program: data.program,
    onboarded_at: new Date().toISOString(),
  });
  if (error) return { ok: false, error: error.message };

  if (data.join_squad) {
    // Best-effort — a squad failure shouldn't block finishing onboarding.
    await joinOrCreateSquad();
  }

  return { ok: true };
}
