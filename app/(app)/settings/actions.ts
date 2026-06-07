"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseConfigured, env } from "@/lib/env";
import {
  createProCheckoutSession,
  createBillingPortalSession,
  cancelSubscriptionNow,
} from "@/lib/stripe";

// ─────────────────────────────────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────────────────────────────────
const GOALS = ["cut", "maintain", "bulk", "mental", "financial"] as const;

const profileSchema = z.object({
  display_name: z.string().trim().min(1, "Add your name.").max(60),
  age: z.coerce.number().int().min(13, "Must be 13+").max(120).optional(),
  primary_goal: z.enum(GOALS).optional(),
  starter_program: z.string().trim().max(60).optional().nullable(),
});

export type ProfileState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function updateProfile(
  _: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  if (!supabaseConfigured) return { error: "Supabase not configured." };
  const sb = await supabaseServer();
  if (!sb) return { error: "Supabase not configured." };
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return { error: "Not signed in." };

  const raw = Object.fromEntries(formData);
  // Empty optional fields come through as "" — normalize so coercion/enum pass.
  const cleaned = {
    display_name: raw.display_name,
    age: raw.age === "" ? undefined : raw.age,
    primary_goal: raw.primary_goal === "" ? undefined : raw.primary_goal,
    starter_program: raw.starter_program === "" ? null : raw.starter_program,
  };

  const parsed = profileSchema.safeParse(cleaned);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] = i.message;
    return { fieldErrors };
  }

  const { error } = await sb
    .from("profiles")
    .update({
      display_name: parsed.data.display_name,
      age: parsed.data.age ?? null,
      primary_goal: parsed.data.primary_goal ?? null,
      starter_program: parsed.data.starter_program ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", u.user.id);
  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────
export type NotificationsPrefs = {
  daily_checkin: boolean;
  squad_alerts: boolean;
  streak_milestones: boolean;
};

export async function saveNotifications(
  prefs: NotificationsPrefs
): Promise<{ ok: boolean; error?: string }> {
  if (!supabaseConfigured) return { ok: false, error: "Supabase not configured." };
  const sb = await supabaseServer();
  if (!sb) return { ok: false, error: "Supabase not configured." };
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return { ok: false, error: "Not signed in." };

  const next = {
    daily_checkin: !!prefs.daily_checkin,
    squad_alerts: !!prefs.squad_alerts,
    streak_milestones: !!prefs.streak_milestones,
  };

  const { error } = await sb
    .from("profiles")
    .update({ notifications_prefs: next, updated_at: new Date().toISOString() })
    .eq("id", u.user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings");
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────────
// SUBSCRIPTION — Stripe Checkout + Customer Portal
// ─────────────────────────────────────────────────────────────────────────
export async function startProCheckout(): Promise<{ url?: string; error?: string }> {
  if (!supabaseConfigured) return { error: "Supabase not configured." };
  const sb = await supabaseServer();
  if (!sb) return { error: "Supabase not configured." };
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return { error: "Not signed in." };

  const { data: p } = await sb
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", u.user.id)
    .maybeSingle();

  const url = await createProCheckoutSession({
    userId: u.user.id,
    email: u.user.email ?? "",
    customerId: p?.stripe_customer_id ?? null,
  });
  if (!url) return { error: "Billing isn't connected yet. Try again later." };
  return { url };
}

export async function openBillingPortal(): Promise<{ url?: string; error?: string }> {
  if (!supabaseConfigured) return { error: "Supabase not configured." };
  const sb = await supabaseServer();
  if (!sb) return { error: "Supabase not configured." };
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return { error: "Not signed in." };

  const { data: p } = await sb
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", u.user.id)
    .maybeSingle();

  if (!p?.stripe_customer_id) {
    return { error: "No billing account found." };
  }
  const url = await createBillingPortalSession(p.stripe_customer_id);
  if (!url) return { error: "Billing portal is unavailable right now." };
  return { url };
}

// ─────────────────────────────────────────────────────────────────────────
// DANGER ZONE — delete account
// ─────────────────────────────────────────────────────────────────────────
// Child tables are wiped first (in case FK cascades aren't all in place),
// then the Stripe sub is cancelled, then the auth user is removed. Best-effort
// per table so one failure doesn't strand the account half-deleted.
const USER_TABLES = [
  "habit_logs",
  "program_task_logs",
  "meal_logs",
  "progress_photos",
  "respect_grants_from", // handled specially below
  "habits",
  "program_enrollments",
  "squad_members",
  "referrals",
  "subscriptions",
  "profiles",
] as const;

export async function deleteAccount(
  confirm: string
): Promise<{ ok: boolean; error?: string }> {
  if (confirm.trim() !== "FORGE") {
    return { ok: false, error: 'Type "FORGE" to confirm.' };
  }
  if (!supabaseConfigured) return { ok: false, error: "Supabase not configured." };

  const sb = await supabaseServer();
  if (!sb) return { ok: false, error: "Supabase not configured." };
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return { ok: false, error: "Not signed in." };
  const userId = u.user.id;

  // 1. Cancel an active Stripe subscription so we don't keep billing a ghost.
  if (env.stripeSecret) {
    const { data: p } = await sb
      .from("profiles")
      .select("stripe_subscription_id")
      .eq("id", userId)
      .maybeSingle();
    if (p?.stripe_subscription_id) {
      await cancelSubscriptionNow(p.stripe_subscription_id);
    }
  }

  // 2. Delete all user data with the service-role client (bypasses RLS).
  let admin;
  try {
    admin = supabaseAdmin();
  } catch {
    return { ok: false, error: "Server isn't configured to delete accounts." };
  }

  for (const table of USER_TABLES) {
    try {
      if (table === "respect_grants_from") {
        await admin.from("respect_grants").delete().eq("from_user_id", userId);
        await admin.from("respect_grants").delete().eq("to_user_id", userId);
        continue;
      }
      await admin.from(table).delete().eq("user_id", userId);
    } catch (err) {
      console.error(`[delete-account] failed clearing ${table}:`, err);
    }
  }

  // 3. Remove the auth user. After this the session is dead.
  const { error: delErr } = await admin.auth.admin.deleteUser(userId);
  if (delErr) {
    console.error("[delete-account] auth deleteUser failed:", delErr.message);
    return { ok: false, error: "Couldn't fully delete the account. Contact support." };
  }

  // 4. Clear the local session cookie. Client redirects home after this.
  try {
    await sb.auth.signOut();
  } catch {
    /* session is already invalid — ignore */
  }
  return { ok: true };
}
