/**
 * Journal entry types. Once an entry is saved it is immutable — RLS on
 * `journal_entries` only allows INSERT + SELECT for the owner (no UPDATE,
 * no DELETE). So every type below is read-only after creation.
 */

export type IdType =
  | "Driver's License"
  | "State ID"
  | "Passport"
  | "Military ID"
  | "Personal Knowledge"
  | "Credible Witness";

export const ID_TYPES: ReadonlyArray<IdType> = [
  "Driver's License",
  "State ID",
  "Passport",
  "Military ID",
  "Personal Knowledge",
  "Credible Witness",
];

export type JournalEntry = {
  id: string;
  user_id: string;
  appointment_id: string | null;
  signer_name: string;
  signer_address: string | null;
  document_type: string;
  signed_at: string;
  location: string | null;
  id_type: string | null;
  id_number_last4: string | null;
  id_issuing_state: string | null;
  witness_name: string | null;
  signature_svg: string | null;
  fee_charged_cents: number | null;
  fee_cents: number;
  notes: string | null;
};
