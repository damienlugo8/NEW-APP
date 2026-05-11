"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";

const profileSchema = z.object({
  full_legal_name: z.string().min(2),
  business_name: z.string().optional().nullable(),
  phone: z.string().min(7),
  commission_state: z.string().length(2),
  commission_expires_at: z.string(),
  notary_id_number: z.string().min(1),
});

export type ProfileState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string> };

export async function updateProfile(
  _: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  if (!supabaseConfigured) return { error: "Supabase not configured." };
  const sb = await supabaseServer();
  if (!sb) return { error: "Supabase not configured." };
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return { error: "Not signed in." };

  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] = i.message;
    return { fieldErrors };
  }

  const { error } = await sb
    .from("profiles")
    .update({
      ...parsed.data,
      business_name: parsed.data.business_name || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", u.user.id);
  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { ok: true };
}

export async function cancelSubscriptionAction(): Promise<ProfileState> {
  // Wired when Stripe is enabled. For now: flag-only update.
  if (!supabaseConfigured) return { error: "Supabase not configured." };
  const sb = await supabaseServer();
  if (!sb) return { error: "Supabase not configured." };
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return { error: "Not signed in." };
  const { error } = await sb
    .from("subscriptions")
    .update({ cancel_at_period_end: true, updated_at: new Date().toISOString() })
    .eq("user_id", u.user.id);
  if (error) return { error: error.message };
  revalidatePath("/settings/billing");
  return { ok: true };
}
