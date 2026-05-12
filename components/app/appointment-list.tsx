"use client";

import { motion } from "framer-motion";
import { CalendarDays, MapPin, Clock, Banknote, Pencil } from "lucide-react";
import { format, isAfter, isBefore } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  appointmentLocationLine,
  appointmentTitle,
  type Appointment,
} from "@/lib/types/appointment";
import { usdCents, cn } from "@/lib/utils";

/**
 * Daily list — the source of truth on mobile. Each row is one signing.
 * Pressing the row opens the edit panel. The "edit" pencil is just an
 * affordance — the whole row is tappable.
 */
export function AppointmentList({
  appointments,
  filterDay,
  onEdit,
  emptyHint,
}: {
  appointments: Appointment[];
  filterDay?: Date | null;
  onEdit: (a: Appointment) => void;
  emptyHint?: string;
}) {
  const items = filterDay
    ? appointments.filter((a) => {
        const d = new Date(a.scheduled_at);
        return (
          d.getFullYear() === filterDay.getFullYear() &&
          d.getMonth() === filterDay.getMonth() &&
          d.getDate() === filterDay.getDate()
        );
      })
    : appointments;

  if (items.length === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center">
        <CalendarDays
          size={22}
          strokeWidth={1.5}
          className="mx-auto text-[var(--text-subtle)]"
        />
        <p className="mt-3 text-sm text-[var(--text)]">
          {filterDay ? "Nothing on this day." : "No signings yet."}
        </p>
        <p className="mt-1 text-xs text-[var(--text-subtle)]">
          {emptyHint ?? "Tap “New signing” to add your first one."}
        </p>
      </div>
    );
  }

  return (
    <ul className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)] overflow-hidden">
      {items.map((a, i) => (
        <Row key={a.id} appointment={a} index={i} onEdit={onEdit} />
      ))}
    </ul>
  );
}

function Row({
  appointment,
  index,
  onEdit,
}: {
  appointment: Appointment;
  index: number;
  onEdit: (a: Appointment) => void;
}) {
  const at = new Date(appointment.scheduled_at);
  const now = new Date();
  const isPast = isBefore(at, now) && appointment.status === "scheduled";
  const isUpcoming = isAfter(at, now);
  const time = format(at, "h:mm a");
  const loc = appointmentLocationLine(appointment);

  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.03, 0.18) }}
    >
      <button
        type="button"
        onClick={() => onEdit(appointment)}
        className="w-full text-left px-4 sm:px-5 py-4 flex items-start gap-4 transition-colors hover:bg-[var(--surface-2)]"
      >
        <div
          className={cn(
            "shrink-0 mt-0.5 flex flex-col items-center justify-center rounded-[10px] border w-[58px] py-2",
            appointment.status === "completed"
              ? "bg-[color-mix(in_oklab,var(--success)_12%,transparent)] border-[color-mix(in_oklab,var(--success)_30%,transparent)] text-[var(--success)]"
              : appointment.status === "cancelled"
              ? "bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-subtle)]"
              : "bg-[var(--accent-soft)] border-[color-mix(in_oklab,var(--accent)_30%,transparent)] text-[var(--accent)]"
          )}
        >
          <span className="text-[10px] uppercase tracking-wider font-mono">
            {format(at, "MMM")}
          </span>
          <span className="text-lg leading-none font-semibold mt-0.5">
            {format(at, "d")}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[15px] font-medium text-[var(--text)] truncate">
              {appointmentTitle(appointment)}
            </p>
            {appointment.status === "completed" && (
              <Badge tone="success">Done</Badge>
            )}
            {appointment.status === "cancelled" && (
              <Badge tone="neutral">Cancelled</Badge>
            )}
            {isPast && appointment.status === "scheduled" && (
              <Badge tone="warning">Needs follow-up</Badge>
            )}
            {isUpcoming && appointment.status === "scheduled" && (
              <Badge tone="accent">Upcoming</Badge>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-1">
              <Clock size={12} strokeWidth={1.75} />
              {time}
              <span className="text-[var(--text-subtle)]">
                · {appointment.duration_min}m
              </span>
            </span>
            {loc && (
              <span className="inline-flex items-center gap-1 truncate max-w-[34ch]">
                <MapPin size={12} strokeWidth={1.75} />
                {loc}
              </span>
            )}
            {appointment.fee_cents > 0 && (
              <span className="inline-flex items-center gap-1">
                <Banknote size={12} strokeWidth={1.75} />
                {usdCents(appointment.fee_cents)}
              </span>
            )}
          </div>
        </div>

        <span
          aria-hidden
          className="shrink-0 h-8 w-8 rounded-full inline-flex items-center justify-center text-[var(--text-subtle)] hover:text-[var(--text)]"
        >
          <Pencil size={14} strokeWidth={1.75} />
        </span>
      </button>
    </motion.li>
  );
}
