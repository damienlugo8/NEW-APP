/**
 * Shared appointment types — the row shape returned by Supabase + the
 * status enum from migration 0002. Used by server actions, the page,
 * the form panel, and the dashboard "Today" widget.
 */

export type AppointmentStatus = "scheduled" | "completed" | "cancelled";

export const APPOINTMENT_STATUSES: ReadonlyArray<{
  value: AppointmentStatus;
  label: string;
}> = [
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

// The "thing happening" — kept loose so notaries can type their own.
// We pre-fill the most common ones at the top.
export const DOCUMENT_TYPES = [
  "Loan signing",
  "Refinance",
  "Reverse mortgage",
  "Seller package",
  "Buyer package",
  "Power of attorney",
  "Affidavit",
  "Acknowledgment",
  "Jurat",
  "Other",
] as const;

export type Appointment = {
  id: string;
  user_id: string;
  title: string | null;
  client_name: string | null;
  document_type: string | null;
  scheduled_at: string;
  duration_min: number;
  fee_cents: number;
  status: AppointmentStatus;
  location: string | null;
  location_address: string | null;
  location_city: string | null;
  location_state: string | null;
  location_zip: string | null;
  notes: string | null;
};

export function appointmentTitle(a: Pick<Appointment, "title" | "document_type" | "client_name">) {
  if (a.title && a.title.length > 0) return a.title;
  const parts = [a.document_type, a.client_name].filter(Boolean) as string[];
  return parts.join(" · ") || "Signing";
}

export function appointmentLocationLine(a: Appointment) {
  if (a.location && a.location.length > 0) return a.location;
  const cityState = [a.location_city, a.location_state].filter(Boolean).join(", ");
  return [a.location_address, cityState].filter(Boolean).join(" · ");
}
