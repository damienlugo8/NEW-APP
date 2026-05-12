"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import type { AppointmentStatus } from "@/lib/types/appointment";

const NOT_CONFIGURED =
  "Database isn't configured yet. Add your Supabase keys to .env.local — see README.md.";

export type AppointmentFormState = {
  error?: string;
  ok?: boolean;
  fieldErrors?: Record<string, string>;
  /** The id of the row we just upserted, so the client can close the panel. */
  id?: string;
};

// Empty string → undefined so optional fields don't break validation.
const optionalString = z.preprocess(
  (v) => (typeof v === "string" && v.trim().length === 0 ? undefined : v),
  z.string().optional()
);

const schema = z.object({
  id: optionalString,
  client_name: z.string().min(1, "Who's the signer?").max(120),
  document_type: z.string().min(1, "What kind of signing?").max(80),
  // datetime-local sends "2026-05-20T14:30" with no zone — we treat it as local
  // time and convert to ISO when writing.
  scheduled_at: z.string().min(10, "Pick a date and time."),
  duration_min: z.coerce.number().int().min(15).max(480).default(60),
  fee_in_dollars: z.coerce.number().min(0).max(10_000).default(0),
  location_address: optionalString,
  location_city: optionalString,
  location_state: optionalString,
  location_zip: optionalString,
  notes: optionalString,
  status: z.enum(["scheduled", "completed", "cancelled"]).default("scheduled"),
});

function readForm(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function asTitle(client_name: string, document_type: string) {
  return `${document_type} · ${client_name}`;
}

export async function saveAppointmentAction(
  _: AppointmentFormState,
  formData: FormData
): Promise<AppointmentFormState> {
  if (!supabaseConfigured) return { error: NOT_CONFIGURED };

  const parsed = schema.safeParse(readForm(formData));
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
  // Convert local datetime to ISO so Postgres stores a real timestamptz.
  const scheduledIso = new Date(v.scheduled_at).toISOString();

  const row = {
    user_id: u.user.id,
    title: asTitle(v.client_name, v.document_type),
    client_name: v.client_name,
    document_type: v.document_type,
    scheduled_at: scheduledIso,
    duration_min: v.duration_min,
    fee_cents: Math.round(v.fee_in_dollars * 100),
    location_address: v.location_address ?? null,
    location_city: v.location_city ?? null,
    location_state: v.location_state ?? null,
    location_zip: v.location_zip ?? null,
    notes: v.notes ?? null,
    status: v.status as AppointmentStatus,
  };

  if (v.id && v.id.length > 0) {
    // Update existing — RLS ensures only the owner can do this.
    const { data, error } = await sb
      .from("appointments")
      .update(row)
      .eq("id", v.id)
      .select("id")
      .single();
    if (error) return { error: error.message };
    revalidatePath("/dashboard");
    revalidatePath("/appointments");
    return { ok: true, id: data.id };
  }

  const { data, error } = await sb
    .from("appointments")
    .insert(row)
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/appointments");
  return { ok: true, id: data.id };
}

export async function completeAppointmentAction(id: string) {
  if (!supabaseConfigured) return { error: NOT_CONFIGURED };
  const sb = await supabaseServer();
  if (!sb) return { error: NOT_CONFIGURED };
  const { error } = await sb
    .from("appointments")
    .update({ status: "completed" as AppointmentStatus })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/appointments");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function cancelAppointmentAction(id: string) {
  if (!supabaseConfigured) return { error: NOT_CONFIGURED };
  const sb = await supabaseServer();
  if (!sb) return { error: NOT_CONFIGURED };
  const { error } = await sb
    .from("appointments")
    .update({ status: "cancelled" as AppointmentStatus })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/appointments");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteAppointmentAction(id: string) {
  if (!supabaseConfigured) return { error: NOT_CONFIGURED };
  const sb = await supabaseServer();
  if (!sb) return { error: NOT_CONFIGURED };
  const { error } = await sb.from("appointments").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/appointments");
  revalidatePath("/dashboard");
  return { ok: true };
}
