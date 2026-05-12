/**
 * Contact = a title company, signing service, or law firm in the pipeline.
 * Stages model the funnel — prospect → contacted → following_up → active_client
 * (or → inactive). Drag-and-drop in the kanban moves a contact between stages.
 */

export type ContactStage =
  | "prospect"
  | "contacted"
  | "following_up"
  | "active_client"
  | "inactive";

export const CONTACT_STAGES: ReadonlyArray<{
  value: ContactStage;
  label: string;
  description: string;
}> = [
  { value: "prospect",      label: "Prospect",      description: "Found them. Haven't reached out yet." },
  { value: "contacted",     label: "Contacted",     description: "First email or call sent." },
  { value: "following_up",  label: "Following up",  description: "Mid-conversation. Need to nudge soon." },
  { value: "active_client", label: "Active client", description: "Sending you work." },
  { value: "inactive",      label: "Inactive",      description: "Cold for now. Revisit next quarter." },
];

export type Contact = {
  id: string;
  user_id: string;
  company_name: string;
  contact_name: string | null;
  contact_role: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  stage: ContactStage;
  notes: string | null;
  last_contacted_at: string | null;
  next_followup_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ActivityType = "email" | "call" | "meeting" | "note";

export const ACTIVITY_TYPES: ReadonlyArray<{ value: ActivityType; label: string }> = [
  { value: "email",   label: "Email" },
  { value: "call",    label: "Call" },
  { value: "meeting", label: "Meeting" },
  { value: "note",    label: "Note" },
];

export type ContactActivity = {
  id: string;
  contact_id: string;
  user_id: string;
  activity_type: ActivityType;
  activity_date: string;
  summary: string | null;
};

export function daysSince(iso: string | null) {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.floor(ms / 86_400_000);
}

/** Heuristic: when should we nudge this contact again? */
export function isOverdue(contact: Pick<Contact, "stage" | "last_contacted_at" | "next_followup_at">) {
  // Explicit follow-up date wins.
  if (contact.next_followup_at) {
    return new Date(contact.next_followup_at) < new Date();
  }
  const days = daysSince(contact.last_contacted_at);
  if (days === null) return contact.stage !== "inactive"; // never contacted
  // Heuristic windows by stage.
  if (contact.stage === "following_up") return days >= 7;
  if (contact.stage === "contacted")    return days >= 14;
  if (contact.stage === "active_client") return days >= 60;
  return false;
}
