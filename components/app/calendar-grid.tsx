"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { appointmentTitle, type Appointment } from "@/lib/types/appointment";

/**
 * Month calendar built from primitives — no react-big-calendar, no fullcalendar.
 * 7×6 grid (always; keeps the layout from jumping). Tap a cell to filter the
 * list below by that day. Tap an event chip to open the form panel.
 *
 * Mobile: cells go small but keep the touch target ≥ 40px; on phone the
 * appointment chips collapse to a count dot under the date number.
 */
export function CalendarGrid({
  appointments,
  selectedDay,
  onSelectDay,
  onSelectAppointment,
}: {
  appointments: Appointment[];
  selectedDay: Date;
  onSelectDay: (d: Date) => void;
  onSelectAppointment: (a: Appointment) => void;
}) {
  const [cursor, setCursor] = useState<Date>(() => startOfMonth(selectedDay));

  const days = useMemo(() => {
    const first = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 });
    const last = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 });
    const out: Date[] = [];
    for (let d = first; d <= last; d = new Date(d.getTime() + 86_400_000)) {
      out.push(d);
    }
    // Always render 42 cells so the height doesn't jump month to month.
    while (out.length < 42) {
      out.push(new Date(out[out.length - 1].getTime() + 86_400_000));
    }
    return out;
  }, [cursor]);

  // Bucket appointments by yyyy-mm-dd for O(1) lookup.
  const byDay = useMemo(() => {
    const m = new Map<string, Appointment[]>();
    for (const a of appointments) {
      const key = format(new Date(a.scheduled_at), "yyyy-MM-dd");
      const list = m.get(key) ?? [];
      list.push(a);
      m.set(key, list);
    }
    return m;
  }, [appointments]);

  const today = new Date();
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => setCursor((c) => addMonths(c, -1))}
            aria-label="Previous month"
          >
            <ChevronLeft size={16} strokeWidth={1.75} />
          </Button>
          <h2 className="t-h3 text-base sm:text-lg min-w-[12ch] text-center">
            {format(cursor, "MMMM yyyy")}
          </h2>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => setCursor((c) => addMonths(c, 1))}
            aria-label="Next month"
          >
            <ChevronRight size={16} strokeWidth={1.75} />
          </Button>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => {
            setCursor(startOfMonth(today));
            onSelectDay(today);
          }}
        >
          Today
        </Button>
      </div>

      <div className="grid grid-cols-7 border-b border-[var(--border)] bg-[var(--surface-2)]">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div
            key={i}
            className="t-caption text-[var(--text-subtle)] py-2 text-center"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((d) => {
          const inMonth = isSameMonth(d, cursor);
          const isSelected = isSameDay(d, selectedDay);
          const isToday = isSameDay(d, today);
          const dayKey = format(d, "yyyy-MM-dd");
          const items = byDay.get(dayKey) ?? [];
          return (
            <button
              key={d.toISOString()}
              type="button"
              onClick={() => onSelectDay(d)}
              className={cn(
                "relative flex flex-col items-stretch gap-1 text-left",
                "min-h-[64px] sm:min-h-[96px] px-1.5 sm:px-2 py-1.5",
                "border-r border-b border-[var(--border)] last:border-r-0",
                "transition-colors duration-150",
                inMonth ? "bg-[var(--surface)]" : "bg-[var(--surface-2)] text-[var(--text-subtle)]",
                isSelected && "ring-1 ring-inset ring-[var(--accent)] bg-[var(--accent-soft)]",
                "hover:bg-[var(--surface-2)]"
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "inline-flex items-center justify-center h-6 w-6 text-xs rounded-full",
                    isToday && "bg-[var(--accent)] text-[var(--accent-fg)] font-semibold",
                    !isToday && inMonth && "text-[var(--text)]",
                    !isToday && !inMonth && "text-[var(--text-subtle)]"
                  )}
                >
                  {d.getDate()}
                </span>
                {items.length > 0 && (
                  <span className="hidden sm:inline t-caption text-[var(--text-subtle)]">
                    {items.length}
                  </span>
                )}
              </div>

              {/* Mobile: a single dot row under the date */}
              <div className="flex sm:hidden gap-0.5 mt-0.5">
                {items.slice(0, 3).map((a) => (
                  <span
                    key={a.id}
                    className={cn(
                      "h-1 w-1 rounded-full",
                      a.status === "completed" ? "bg-[var(--success)]" :
                      a.status === "cancelled" ? "bg-[var(--text-subtle)]" :
                      "bg-[var(--accent)]"
                    )}
                  />
                ))}
                {items.length > 3 && (
                  <span className="t-caption text-[var(--text-subtle)] -mt-0.5">+{items.length - 3}</span>
                )}
              </div>

              {/* Desktop: real event chips */}
              <div className="hidden sm:flex flex-col gap-0.5">
                {items.slice(0, 3).map((a) => (
                  <motion.button
                    key={a.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectAppointment(a);
                    }}
                    className={cn(
                      "truncate text-left text-[11px] px-1.5 py-0.5 rounded-[6px]",
                      a.status === "completed"
                        ? "bg-[color-mix(in_oklab,var(--success)_18%,transparent)] text-[var(--success)]"
                        : a.status === "cancelled"
                        ? "bg-[var(--surface-2)] text-[var(--text-subtle)] line-through"
                        : "bg-[var(--accent-soft)] text-[var(--accent)]"
                    )}
                    whileTap={{ scale: 0.98 }}
                  >
                    {format(new Date(a.scheduled_at), "h:mma").toLowerCase()}
                    <span className="ml-1 opacity-80">{appointmentTitle(a)}</span>
                  </motion.button>
                ))}
                {items.length > 3 && (
                  <span className="t-caption text-[var(--text-subtle)] px-1.5">
                    +{items.length - 3} more
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
