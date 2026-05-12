import { supabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import type { JournalEntry } from "@/lib/types/journal";

const COLUMNS =
  "id, user_id, appointment_id, signer_name, signer_address, document_type, signed_at, location, id_type, id_number_last4, id_issuing_state, witness_name, signature_svg, fee_charged_cents, fee_cents, notes";

export async function listJournalEntries(): Promise<JournalEntry[]> {
  if (!supabaseConfigured) return [];
  const sb = await supabaseServer();
  if (!sb) return [];
  const { data } = await sb
    .from("journal_entries")
    .select(COLUMNS)
    .order("signed_at", { ascending: false });
  return (data ?? []) as JournalEntry[];
}

export async function getJournalEntry(id: string): Promise<JournalEntry | null> {
  if (!supabaseConfigured) return null;
  const sb = await supabaseServer();
  if (!sb) return null;
  const { data } = await sb
    .from("journal_entries")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  return (data as JournalEntry | null) ?? null;
}

/**
 * Sequential, 1-based number for an entry within the user's journal. We
 * compute it client-side from the full list rather than persisting a counter
 * column — keeps the schema simple and the journal append-only.
 */
export function entryNumber(entries: JournalEntry[], id: string) {
  // Entries are returned newest-first; reverse for 1-based chronological numbering.
  const chrono = [...entries].sort(
    (a, b) => new Date(a.signed_at).getTime() - new Date(b.signed_at).getTime()
  );
  const idx = chrono.findIndex((e) => e.id === id);
  return idx === -1 ? 0 : idx + 1;
}

export async function countJournalEntries(): Promise<number> {
  if (!supabaseConfigured) return 0;
  const sb = await supabaseServer();
  if (!sb) return 0;
  const { count } = await sb
    .from("journal_entries")
    .select("id", { count: "exact", head: true });
  return count ?? 0;
}
