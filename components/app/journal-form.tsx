"use client";

import { useActionState, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { format } from "date-fns";
import { AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SignaturePadField } from "@/components/app/signature-pad";
import {
  saveJournalEntryAction,
  type JournalFormState,
} from "@/app/(app)/journal/actions";
import { ID_TYPES } from "@/lib/types/journal";
import { DOCUMENT_TYPES, type Appointment } from "@/lib/types/appointment";
import { US_STATES } from "@/lib/constants/states";

const initial: JournalFormState = {};

function toLocalInput(d: Date) {
  return format(d, "yyyy-MM-dd'T'HH:mm");
}

/**
 * Mobile-first single-page form. We don't use a slide-in panel here because
 * the journal form is long, the signature pad needs vertical room, and the
 * "this is permanent" warning at the top deserves the whole screen.
 *
 * If the user has selected an appointment, we prefill from it — saves typing
 * before a signing they've already scheduled.
 */
export function JournalForm({
  appointments,
  preselectedAppointmentId,
}: {
  appointments: Appointment[];
  preselectedAppointmentId?: string;
}) {
  const [state, action, pending] = useActionState(saveJournalEntryAction, initial);
  const reduce = useReducedMotion();
  const [selectedAppt, setSelectedAppt] = useState<string>(
    preselectedAppointmentId ?? ""
  );

  const linked = appointments.find((a) => a.id === selectedAppt);

  return (
    <motion.form
      action={action}
      initial={{ opacity: 0, y: reduce ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-5"
    >
      <div className="rounded-[var(--radius-lg)] border border-[color-mix(in_oklab,var(--warning)_30%,transparent)] bg-[color-mix(in_oklab,var(--warning)_8%,transparent)] p-4 flex gap-3">
        <AlertTriangle
          size={18}
          strokeWidth={1.75}
          className="shrink-0 text-[var(--warning)] mt-0.5"
        />
        <div>
          <p className="text-sm font-medium">This entry locks the moment you save it.</p>
          <p className="text-xs text-[var(--text-muted)] mt-1 max-w-[60ch]">
            That&apos;s on purpose — a notary journal that can be edited after
            the fact isn&apos;t a legal record. Double-check the details before
            you tap save. You can always add a separate note entry later.
          </p>
        </div>
      </div>

      {appointments.length > 0 && (
        <Select
          name="appointment_id"
          label="Link to a signing (optional)"
          value={selectedAppt}
          onChange={(e) => setSelectedAppt(e.target.value)}
        >
          <option value="">— none —</option>
          {appointments.map((a) => (
            <option key={a.id} value={a.id}>
              {format(new Date(a.scheduled_at), "MMM d · h:mm a")} ·{" "}
              {a.client_name ?? a.title ?? "Signing"}
            </option>
          ))}
        </Select>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          name="signer_name"
          label="Signer's full name"
          defaultValue={linked?.client_name ?? ""}
          placeholder="Maria del Carmen Rodríguez"
          error={state.fieldErrors?.signer_name}
          required
          autoFocus
        />
        <Input
          name="signed_at"
          label="Date & time signed"
          type="datetime-local"
          defaultValue={
            linked
              ? toLocalInput(new Date(linked.scheduled_at))
              : toLocalInput(new Date())
          }
          error={state.fieldErrors?.signed_at}
          required
        />
      </div>

      <Input
        name="signer_address"
        label="Signer's address"
        placeholder="47 Ridge Road, Mahwah NJ 07430"
        defaultValue={
          linked
            ? [linked.location_address, linked.location_city, linked.location_state, linked.location_zip]
                .filter(Boolean)
                .join(", ")
            : ""
        }
      />

      <Select
        name="document_type"
        label="Document type"
        defaultValue={linked?.document_type ?? "Loan signing"}
        error={state.fieldErrors?.document_type}
        required
      >
        {DOCUMENT_TYPES.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </Select>

      <div className="t-caption text-[var(--text-subtle)] pt-2">
        Identity verification
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[1.4fr_1fr_120px] gap-3">
        <Select name="id_type" label="ID type" defaultValue="Driver's License">
          {ID_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>
        <Input
          name="id_number_last4"
          label="Last 4 of ID #"
          placeholder="1234"
          inputMode="numeric"
          maxLength={4}
        />
        <Select name="id_issuing_state" label="Issued by" defaultValue="">
          <option value="">—</option>
          {US_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
      </div>
      <p className="text-[11px] text-[var(--text-subtle)] -mt-2">
        We only store the last 4 of the ID — never the whole number. Most state
        boards explicitly forbid storing the full ID.
      </p>

      <Input
        name="witness_name"
        label="Credible witness name (if any)"
        placeholder="Optional"
      />

      <Input
        name="location"
        label="Signing location"
        placeholder={linked?.location_city ? `${linked.location_city}, ${linked.location_state}` : "Bergen County, NJ"}
        defaultValue={
          linked
            ? [linked.location_city, linked.location_state].filter(Boolean).join(", ")
            : ""
        }
      />

      <Input
        name="fee_in_dollars"
        label="Fee charged ($)"
        type="number"
        min={0}
        step={5}
        inputMode="decimal"
        defaultValue={linked ? (linked.fee_cents / 100).toFixed(0) : ""}
        placeholder="200"
      />

      <SignaturePadField />

      <Textarea
        name="notes"
        label="Notes (private)"
        rows={3}
        placeholder="Anything unusual — wrong page printed, signer needed glasses, etc."
      />

      {state.error && (
        <p className="text-sm text-[var(--danger)]">{state.error}</p>
      )}

      <div className="flex items-center justify-between gap-3 pt-2">
        <p className="text-xs text-[var(--text-subtle)]">
          By saving you confirm the signer was present and identified.
        </p>
        <Button type="submit" loading={pending}>
          Save and lock entry
        </Button>
      </div>
    </motion.form>
  );
}
