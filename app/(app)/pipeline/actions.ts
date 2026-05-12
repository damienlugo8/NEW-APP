"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import type { ContactStage } from "@/lib/types/contact";

const NOT_CONFIGURED =
  "Database isn't configured yet. Add your Supabase keys to .env.local — see README.md.";

export type ContactFormState = {
  error?: string;
  ok?: boolean;
  fieldErrors?: Record<string, string>;
  id?: string;
};

const optionalString = z.preprocess(
  (v) => (typeof v === "string" && v.trim().length === 0 ? undefined : v),
  z.string().optional()
);

const contactSchema = z.object({
  id: optionalString,
  company_name: z.string().min(1, "Company name is required.").max(120),
  contact_name: optionalString,
  contact_role: optionalString,
  phone: optionalString,
  email: optionalString.refine(
    (v) => !v || /.+@.+\..+/.test(v),
    "Email looks off."
  ),
  address: optionalString,
  stage: z.enum([
    "prospect", "contacted", "following_up", "active_client", "inactive",
  ]),
  notes: optionalString,
  next_followup_at: optionalString,
});

export async function saveContactAction(
  _: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  if (!supabaseConfigured) return { error: NOT_CONFIGURED };
  const parsed = contactSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path[0];
      if (typeof k === "string" && !fieldErrors[k]) fieldErrors[k] = issue.message;
    }
    return { error: "Check the highlighted fields.", fieldErrors };
  }
  const sb = await supabaseServer();
  if (!sb) return { error: NOT_CONFIGURED };
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return { error: "Please log in again." };

  const v = parsed.data;
  const row = {
    user_id: u.user.id,
    company_name: v.company_name,
    contact_name: v.contact_name ?? null,
    contact_role: v.contact_role ?? null,
    phone: v.phone ?? null,
    email: v.email ?? null,
    address: v.address ?? null,
    stage: v.stage as ContactStage,
    notes: v.notes ?? null,
    next_followup_at: v.next_followup_at
      ? new Date(v.next_followup_at).toISOString()
      : null,
    updated_at: new Date().toISOString(),
  };

  if (v.id) {
    const { data, error } = await sb
      .from("contacts")
      .update(row)
      .eq("id", v.id)
      .select("id")
      .single();
    if (error) return { error: error.message };
    revalidatePath("/pipeline");
    revalidatePath(`/pipeline/${v.id}`);
    revalidatePath("/dashboard");
    return { ok: true, id: data.id };
  }

  const { data, error } = await sb
    .from("contacts")
    .insert(row)
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  return { ok: true, id: data.id };
}

/**
 * Optimistic move via DnD — called as a fire-and-forget from the kanban.
 * The client updates the UI instantly; the server reconciles.
 */
export async function moveContactStageAction(id: string, stage: ContactStage) {
  if (!supabaseConfigured) return { error: NOT_CONFIGURED };
  const sb = await supabaseServer();
  if (!sb) return { error: NOT_CONFIGURED };
  const { error } = await sb
    .from("contacts")
    .update({ stage, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/pipeline");
  return { ok: true };
}

export async function deleteContactAction(id: string) {
  if (!supabaseConfigured) return { error: NOT_CONFIGURED };
  const sb = await supabaseServer();
  if (!sb) return { error: NOT_CONFIGURED };
  const { error } = await sb.from("contacts").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/pipeline");
  return { ok: true };
}

const activitySchema = z.object({
  contact_id: z.string().uuid(),
  activity_type: z.enum(["email", "call", "meeting", "note"]),
  activity_date: optionalString,
  summary: optionalString,
});

export async function logActivityAction(
  _: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  if (!supabaseConfigured) return { error: NOT_CONFIGURED };
  const parsed = activitySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "Pick a type and try again." };
  const sb = await supabaseServer();
  if (!sb) return { error: NOT_CONFIGURED };
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return { error: "Please log in again." };
  const v = parsed.data;
  const { error } = await sb.from("contact_activities").insert({
    contact_id: v.contact_id,
    user_id: u.user.id,
    activity_type: v.activity_type,
    activity_date: v.activity_date
      ? new Date(v.activity_date).toISOString()
      : new Date().toISOString(),
    summary: v.summary ?? null,
  });
  if (error) return { error: error.message };
  revalidatePath(`/pipeline/${v.contact_id}`);
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  return { ok: true };
}
