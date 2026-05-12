import { supabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import type { Contact, ContactActivity } from "@/lib/types/contact";

const CONTACT_COLUMNS =
  "id, user_id, company_name, contact_name, contact_role, phone, email, address, stage, notes, last_contacted_at, next_followup_at, created_at, updated_at";

const ACTIVITY_COLUMNS =
  "id, contact_id, user_id, activity_type, activity_date, summary";

export async function listContacts(): Promise<Contact[]> {
  if (!supabaseConfigured) return [];
  const sb = await supabaseServer();
  if (!sb) return [];
  const { data } = await sb
    .from("contacts")
    .select(CONTACT_COLUMNS)
    .order("updated_at", { ascending: false });
  return (data ?? []) as Contact[];
}

export async function getContact(id: string): Promise<Contact | null> {
  if (!supabaseConfigured) return null;
  const sb = await supabaseServer();
  if (!sb) return null;
  const { data } = await sb
    .from("contacts")
    .select(CONTACT_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  return (data as Contact | null) ?? null;
}

export async function listActivitiesFor(contactId: string): Promise<ContactActivity[]> {
  if (!supabaseConfigured) return [];
  const sb = await supabaseServer();
  if (!sb) return [];
  const { data } = await sb
    .from("contact_activities")
    .select(ACTIVITY_COLUMNS)
    .eq("contact_id", contactId)
    .order("activity_date", { ascending: false });
  return (data ?? []) as ContactActivity[];
}

/**
 * "Who needs a nudge?" — contacts whose explicit follow-up is past, or whose
 * heuristic window has lapsed. Returns at most `limit` rows.
 */
export async function listOverdueContacts(limit = 5): Promise<Contact[]> {
  const all = await listContacts();
  const now = Date.now();
  return all
    .filter((c) => {
      if (c.stage === "inactive") return false;
      if (c.next_followup_at) return new Date(c.next_followup_at).getTime() < now;
      if (!c.last_contacted_at) return c.stage === "prospect";
      const days = (now - new Date(c.last_contacted_at).getTime()) / 86_400_000;
      if (c.stage === "following_up") return days >= 7;
      if (c.stage === "contacted") return days >= 14;
      if (c.stage === "active_client") return days >= 60;
      return false;
    })
    .slice(0, limit);
}
