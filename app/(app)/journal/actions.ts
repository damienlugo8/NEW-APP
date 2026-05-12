"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";

const NOT_CONFIGURED =
  "Database isn't configured yet. Add your Supabase keys to .env.local — see README.md.";

export type JournalFormState = {
  error?: string;
  ok?: boolean;
  fieldErrors?: Record<string, string>;
  id?: string;
};

const optionalString = z.preprocess(
  (v) => (typeof v === "string" && v.trim().length === 0 ? undefined : v),
  z.string().optional()
);

const schema = z.object({
  appointment_id: optionalString,
  signer_name: z.string().min(1, "Signer name is required.").max(120),
  signer_address: optionalString,
  document_type: z.string().min(1, "Document type is required.").max(80),
  signed_at: z.string().min(10, "Pick a date and time."),
  location: optionalString,
  id_type: optionalString,
  id_number_last4: z.preprocess(
    (v) => (typeof v === "string" ? v.replace(/\D/g, "").slice(0, 4) : v),
    z.string().max(4).optional()
  ),
  id_issuing_state: optionalString,
  witness_name: optionalString,
  signature_svg: optionalString,
  fee_in_dollars: z.coerce.number().min(0).max(10_000).default(0),
  notes: optionalString,
});

/**
 * Append-only — RLS forbids UPDATE/DELETE on journal_entries. This action only
 * inserts. There is no editJournalEntryAction by design.
 */
export async function saveJournalEntryAction(
  _: JournalFormState,
  formData: FormData
): Promise<JournalFormState> {
  if (!supabaseConfigured) return { error: NOT_CONFIGURED };
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
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
  const feeCents = Math.round(v.fee_in_dollars * 100);

  const { data, error } = await sb
    .from("journal_entries")
    .insert({
      user_id: u.user.id,
      appointment_id: v.appointment_id ?? null,
      signer_name: v.signer_name,
      signer_address: v.signer_address ?? null,
      document_type: v.document_type,
      signed_at: new Date(v.signed_at).toISOString(),
      location: v.location ?? null,
      id_type: v.id_type ?? null,
      id_number_last4: v.id_number_last4 ?? null,
      id_issuing_state: v.id_issuing_state ?? null,
      witness_name: v.witness_name ?? null,
      signature_svg: v.signature_svg ?? null,
      fee_cents: feeCents,
      fee_charged_cents: feeCents,
      notes: v.notes ?? null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/journal");
  revalidatePath("/dashboard");
  redirect(`/journal/${data.id}?new=1`);
}
