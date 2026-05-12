"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { CalendarDays, List, Plus } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { CalendarGrid } from "@/components/app/calendar-grid";
import { AppointmentList } from "@/components/app/appointment-list";
import { AppointmentForm } from "@/components/app/appointment-form";
import type { Appointment } from "@/lib/types/appointment";
import { cn } from "@/lib/utils";

type View = "calendar" | "list";

/**
 * Client wrapper that orchestrates view-toggle + selected-day + slide-in form.
 * The data is fetched server-side and handed down — we don't refetch here.
 * After mutations the server actions revalidatePath('/appointments') and the
 * router re-runs the page automatically.
 */
export function AppointmentsPageClient({
  appointments,
}: {
  appointments: Appointment[];
}) {
  const [view, setView] = useState<View>("calendar");
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const reduce = useReducedMotion();

  const upcomingCount = useMemo(
    () =>
      appointments.filter(
        (a) =>
          a.status === "scheduled" &&
          new Date(a.scheduled_at) >= new Date()
      ).length,
    [appointments]
  );

  const openNew = () => {
    setEditing(null);
    setOpen(true);
  };
  const openEdit = (a: Appointment) => {
    setEditing(a);
    setOpen(true);
  };

  return (
    <div className="mx-auto max-w-[1280px] px-5 lg:px-8 py-8 pb-24 lg:pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <p className="t-caption text-[var(--text-subtle)] mb-2">Appointments</p>
          <h1 className="t-h1">
            {appointments.length === 0
              ? "Your calendar, fresh."
              : upcomingCount === 0
              ? "Nothing on deck."
              : upcomingCount === 1
              ? "1 signing ahead."
              : `${upcomingCount} signings ahead.`}
          </h1>
          <p className="t-body text-[var(--text-muted)] mt-2 max-w-[60ch]">
            Tap a day to see what&apos;s on it. Tap a signing to edit. Mileage
            and fees roll up automatically.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-0.5">
            <ToggleBtn
              active={view === "calendar"}
              onClick={() => setView("calendar")}
              label="Calendar"
              icon={<CalendarDays size={14} strokeWidth={1.75} />}
            />
            <ToggleBtn
              active={view === "list"}
              onClick={() => setView("list")}
              label="List"
              icon={<List size={14} strokeWidth={1.75} />}
            />
          </div>
          <Button onClick={openNew} size="sm">
            <Plus size={14} strokeWidth={2} /> New signing
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === "calendar" ? (
          <motion.div
            key="cal"
            initial={{ opacity: 0, y: reduce ? 0 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduce ? 0 : -6 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col gap-6"
          >
            <CalendarGrid
              appointments={appointments}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
              onSelectAppointment={openEdit}
            />
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="t-h3 text-base">
                  {format(selectedDay, "EEEE, MMM d")}
                </h2>
                <Button size="sm" variant="ghost" onClick={openNew}>
                  <Plus size={14} strokeWidth={2} /> Add
                </Button>
              </div>
              <AppointmentList
                appointments={appointments}
                filterDay={selectedDay}
                onEdit={openEdit}
                emptyHint="Tap “Add” to put something on this day."
              />
            </section>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: reduce ? 0 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduce ? 0 : -6 }}
            transition={{ duration: 0.18 }}
          >
            <AppointmentList appointments={appointments} onEdit={openEdit} />
          </motion.div>
        )}
      </AnimatePresence>

      <AppointmentForm
        open={open}
        onClose={() => setOpen(false)}
        editing={editing}
        defaultDate={selectedDay}
      />
    </div>
  );
}

function ToggleBtn({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-8 px-3 text-sm inline-flex items-center gap-1.5 rounded-[6px] transition-colors",
        active
          ? "bg-[var(--surface-2)] text-[var(--text)]"
          : "text-[var(--text-muted)] hover:text-[var(--text)]"
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
