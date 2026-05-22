"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  HARD75_DURATION,
  HARD75_REQUIRED_PER_DAY,
  type DayCompletion,
} from "@/lib/types/hard75";

/**
 * The 75-cell ruler — the canonical Hard 75 visual.
 *
 * Layout: 15 columns × 5 rows. On mobile (375px) each cell is ~17px,
 * a tight constellation that fits without horizontal scroll. On md+ the
 * cells breathe to 22px. Every 15th column (day 15/30/45/60/75) gets a
 * thin iron-band tick underneath to make the milestones legible at a
 * glance — the same idiom as a fretboard's dot inlays.
 *
 * State:
 *   - Empty: hairline outline
 *   - Partial completion: filled at low opacity (the day was logged but
 *     not all 6 tasks)
 *   - Full day: solid ember
 *   - Today: ember outline ring + ember-pulse when ≥ 1 task is logged
 *   - Future: very subtle dotted outline
 */
export function Hard75ProgressRuler({
  history,
  currentDay,
}: {
  history: DayCompletion[];
  currentDay: number;
}) {
  const reduce = useReducedMotion();
  // Build a 75-length state array: 0..currentDay-1 from history, rest future.
  const cells: Array<{
    day: number;
    status: "empty" | "partial" | "full" | "today-empty" | "today-partial" | "future";
    pct: number;
  }> = [];
  for (let i = 0; i < HARD75_DURATION; i++) {
    const day = i + 1;
    const isToday = day === currentDay;
    const isPast = day < currentDay;
    const isFuture = day > currentDay;
    const rec = history[i];
    const completed = rec?.completed.length ?? 0;
    const pct = completed / HARD75_REQUIRED_PER_DAY;
    if (isFuture) {
      cells.push({ day, status: "future", pct: 0 });
    } else if (isToday) {
      cells.push({
        day,
        status: completed > 0 ? "today-partial" : "today-empty",
        pct,
      });
    } else if (isPast) {
      if (rec?.full) cells.push({ day, status: "full", pct: 1 });
      else if (completed > 0) cells.push({ day, status: "partial", pct });
      else cells.push({ day, status: "empty", pct: 0 });
    }
  }

  const completedDays = history.filter((d) => d.full).length;

  return (
    <section
      aria-label="75-day progress"
      className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5"
    >
      <header className="flex items-baseline justify-between mb-4">
        <div>
          <p className="t-caption text-[var(--text-subtle)] mb-1">Forge</p>
          <h3 className="t-day-serif text-[1.35rem] leading-none">
            <em className="text-[var(--text-muted)]">Day</em>{" "}
            <span className="text-[var(--text)] t-num-display">
              {currentDay}
            </span>
            <span className="text-[var(--text-subtle)] t-num-display">
              /{HARD75_DURATION}
            </span>
          </h3>
        </div>
        <p className="t-num-mono text-xs text-[var(--text-muted)]">
          {completedDays} clean
        </p>
      </header>

      <div
        role="img"
        aria-label={`${completedDays} of ${HARD75_DURATION} days clean, currently on day ${currentDay}`}
        className="grid grid-cols-15 gap-[5px] sm:gap-[6px]"
        style={{ gridTemplateColumns: "repeat(15, minmax(0, 1fr))" }}
      >
        {cells.map((c, i) => (
          <Cell key={i} cell={c} reduce={!!reduce} />
        ))}
      </div>

      {/* Milestone legend */}
      <div className="mt-3 flex justify-between text-[10px] tracking-wide font-mono text-[var(--text-subtle)] px-[2px]">
        <span>01</span>
        <span>15</span>
        <span>30</span>
        <span>45</span>
        <span>60</span>
        <span>75</span>
      </div>
    </section>
  );
}

function Cell({
  cell,
  reduce,
}: {
  cell: {
    day: number;
    status: "empty" | "partial" | "full" | "today-empty" | "today-partial" | "future";
    pct: number;
  };
  reduce: boolean;
}) {
  const { status, day, pct } = cell;
  const isToday = status.startsWith("today");

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.32,
        ease: [0.16, 1, 0.3, 1],
        delay: reduce ? 0 : Math.min(0.6, day * 0.004),
      }}
      title={`Day ${day}`}
      className={cn(
        "aspect-square rounded-[3px] relative",
        status === "full" && "bg-[var(--accent)]",
        status === "partial" && "bg-[var(--accent)]/35",
        status === "empty" && "bg-[var(--surface-2)] border border-[var(--border-soft)]",
        status === "future" && "border border-dashed border-[var(--border-soft)]",
        isToday &&
          "border border-[var(--accent)] shadow-[0_0_0_2px_color-mix(in_oklab,var(--accent)_22%,transparent)]",
        status === "today-partial" && "bg-[var(--accent)]/30 ember-pulse",
        status === "today-empty" && "ember-pulse"
      )}
    >
      {/* Partial completion bar at bottom — only for non-today partials */}
      {status === "partial" && pct > 0 && pct < 1 && (
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 bg-[var(--accent)] rounded-b-[3px]"
          style={{ height: `${Math.max(15, pct * 100)}%`, opacity: 0.7 }}
        />
      )}
    </motion.div>
  );
}
