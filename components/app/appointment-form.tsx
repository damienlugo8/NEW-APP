"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, Trash2, Check } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  saveAppointmentAction,
  deleteAppointmentAction,
  type AppointmentFormState,
} from "@/app/(app)/appointments/actions";
import {
  APPOINTMENT_STATUSES,
  DOCUMENT_TYPES,
  type Appointment,
} from "@/lib/types/appointment";
import { US_STATES } from "@/lib/constants/states";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;
const initial: AppointmentFormState = {};

/** Format a Date in the local TZ as "YYYY-MM-DDTHH:mm" for <input type="datetime-local"> */
function toLocalInput(d: Date) {
  return format(d, "yyyy-MM-dd'T'HH:mm");
}

function defaultScheduledAt(seed?: Date) {
  const base = seed ?? new Date();
  const d = new Date(base);
  // Round to the next hour, but if it's already past today and seed is a future
  // day, default to 10:00 AM on that day.
  if (seed && !isToday(seed)) {
    d.setHours(10, 0, 0, 0);
  } else {
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 1);
  }
  return d;
}

function isToday(d: Date) {
  const t = new Date();
  return d.getFullYear() === t.getFullYear() &&
    d.getMonth() === t.getMonth() &&
    d.getDate() === t.getDate();
}

export function AppointmentForm({
  open,
  onClose,
  editing,
  defaultDate,
}: {
  open: boolean;
  onClose: () => void;
  editing?: Appointment | null;
  defaultDate?: Date;
}) {
  const reduce = useReducedMotion();
  const [state, action, pending] = useActionState(saveAppointmentAction, initial);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Close panel after a successful save.
  useEffect(() => {
    if (state.ok) {
      onClose();
    }
  }, [state.ok, onClose]);

  // ESC closes the panel.
  useEffect(() => {
    if (!open) return;
    const on = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [open, onClose]);

  // Reset internal "confirm delete" prompt when the panel opens for a new row.
  useEffect(() => {
    if (open) setConfirmDelete(false);
  }, [open, editing?.id]);

  const seedDateValue = editing
    ? toLocalInput(new Date(editing.scheduled_at))
    : toLocalInput(defaultScheduledAt(defaultDate));

  const handleDelete = async () => {
    if (!editing?.id) return;
    setDeleting(true);
    await deleteAppointmentAction(editing.id);
    setDeleting(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Scrim */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.18 }}
            onClick={onClose}
            aria-hidden
          />
          {/* Panel */}
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={editing ? "Edit appointment" : "New appointment"}
            className={cn(
              "fixed z-50 bg-[var(--bg)] border-l border-[var(--border)] shadow-[var(--shadow-lg)]",
              "right-0 top-0 h-[100dvh] w-full sm:w-[440px] flex flex-col"
            )}
            initial={{ x: reduce ? 0 : "100%" }}
            animate={{ x: 0 }}
            exit={{ x: reduce ? 0 : "100%" }}
            transition={{ duration: reduce ? 0 : 0.32, ease }}
          >
            <header className="h-14 px-5 flex items-center justify-between border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <h3 className="t-h3 text-base">
                  {editing ? "Edit signing" : "New signing"}
                </h3>
                {editing && (
                  <Badge
                    tone={
                      editing.status === "completed" ? "success" :
                      editing.status === "cancelled" ? "neutral" : "accent"
                    }
                  >
                    {editing.status}
                  </Badge>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Close"
              >
                <X size={16} strokeWidth={1.75} />
              </Button>
            </header>

            <form
              ref={formRef}
              action={action}
              className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4"
            >
              {editing?.id && <input type="hidden" name="id" value={editing.id} />}

              <Input
                name="client_name"
                label="Signer or client"
                defaultValue={editing?.client_name ?? ""}
                placeholder="Maria Hernandez · First American Title"
                error={state.fieldErrors?.client_name}
                autoFocus
                required
              />

              <Select
                name="document_type"
                label="Document type"
                defaultValue={editing?.document_type ?? "Loan signing"}
                error={state.fieldErrors?.document_type}
                required
              >
                {DOCUMENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  name="scheduled_at"
                  label="When"
                  type="datetime-local"
                  defaultValue={seedDateValue}
                  error={state.fieldErrors?.scheduled_at}
                  required
                />
                <Input
                  name="duration_min"
                  label="Duration (min)"
                  type="number"
                  min={15}
                  max={480}
                  step={15}
                  inputMode="numeric"
                  defaultValue={editing?.duration_min ?? 60}
                  error={state.fieldErrors?.duration_min}
                />
              </div>

              <Input
                name="fee_in_dollars"
                label="Fee ($)"
                type="number"
                min={0}
                step={5}
                inputMode="decimal"
                defaultValue={editing ? (editing.fee_cents / 100).toFixed(0) : ""}
                placeholder="200"
                error={state.fieldErrors?.fee_in_dollars}
              />

              <div className="t-caption text-[var(--text-subtle)] pt-2">Location</div>
              <Input
                name="location_address"
                label="Address"
                defaultValue={editing?.location_address ?? ""}
                placeholder="47 Ridge Road"
              />
              <div className="grid grid-cols-[1fr_90px_110px] gap-2">
                <Input
                  name="location_city"
                  label="City"
                  defaultValue={editing?.location_city ?? ""}
                  placeholder="Mahwah"
                />
                <Select
                  name="location_state"
                  label="State"
                  defaultValue={editing?.location_state ?? ""}
                >
                  <option value="">—</option>
                  {US_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
                <Input
                  name="location_zip"
                  label="ZIP"
                  defaultValue={editing?.location_zip ?? ""}
                  placeholder="07430"
                  inputMode="numeric"
                />
              </div>

              <Select
                name="status"
                label="Status"
                defaultValue={editing?.status ?? "scheduled"}
              >
                {APPOINTMENT_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </Select>

              <Textarea
                name="notes"
                label="Notes (private)"
                defaultValue={editing?.notes ?? ""}
                placeholder="Gate code 4421. Spanish-speaking signer."
                rows={3}
              />

              {state.error && (
                <p className="text-sm text-[var(--danger)]">{state.error}</p>
              )}
            </form>

            <footer className="h-16 px-5 border-t border-[var(--border)] flex items-center justify-between gap-3">
              {editing ? (
                confirmDelete ? (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    loading={deleting}
                    onClick={handleDelete}
                  >
                    <Check size={14} strokeWidth={1.75} /> Really delete
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 size={14} strokeWidth={1.75} /> Delete
                  </Button>
                )
              ) : (
                <span />
              )}
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  loading={pending}
                  onClick={() => formRef.current?.requestSubmit()}
                >
                  {editing ? "Save changes" : "Add signing"}
                </Button>
              </div>
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
