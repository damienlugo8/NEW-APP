"use client";

import { cn } from "@/lib/utils";
import {
  gradeColor,
  gradeForCompletion,
  type DayRecord,
  type Grade,
} from "@/lib/types/habit";

/**
 * 28-day rolling history. Mini grid of letter grades — one cell per day,
 * newest on the right (reading-order recency).
 *
 * Cell anatomy:
 *   - Background: gradeColor at 14% opacity
 *   - Letter:     gradeColor at full
 *   - Border:     subtle iron-band so empty days still feel like ground
 *
 * On 375px we render a 7-wide grid (4 rows). On md+ we render 14-wide
 * (2 rows) so a full month-ish view fits one line of sight.
 */
export function CalendarHistory({
  history,
}: {
  history: DayRecord[];
}) {
  // history is desc (today first); reverse to chronological for the grid.
  const chrono = [...history].reverse();
  const today = chrono[chrono.length - 1]?.date;

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="t-caption text-[var(--text-subtle)]">Last 28 days</p>
        <p className="t-caption text-[var(--text-subtle)]">
          {chrono[0]?.date.slice(5)} → today
        </p>
      </div>

      <div className="grid grid-cols-7 md:grid-cols-14 gap-1.5">
        {chrono.map((d) => {
          const empty = d.completed === 0 && d.date !== today;
          const grade: Grade | null = empty
            ? null
            : gradeForCompletion(d.completed, d.total);
          const color = grade ? gradeColor(grade) : "var(--border)";
          const isToday = d.date === today;
          const label = `${d.date}: ${grade ?? "no log"} (${d.completed}/${d.total})`;

          return (
            <div
              key={d.date}
              title={label}
              aria-label={label}
              className={cn(
                "aspect-square rounded-[6px] border inline-flex items-center justify-center",
                "text-[11px] font-mono tabular-nums font-semibold transition-colors"
              )}
              style={{
                backgroundColor: grade
                  ? `color-mix(in oklab, ${color} 14%, transparent)`
                  : "var(--surface-2)",
                borderColor: grade
                  ? `color-mix(in oklab, ${color} 36%, transparent)`
                  : "var(--border)",
                color: grade ? color : "var(--text-subtle)",
                fontFeatureSettings: "'tnum' 1, 'ss01' 1",
                // Today ring — ring-offset + ring, hand-rolled because
                // Tailwind v4 can't take an opacity modifier on a var class.
                ...(isToday
                  ? {
                      boxShadow:
                        "0 0 0 1px var(--surface), 0 0 0 3px color-mix(in oklab, var(--accent) 40%, transparent)",
                    }
                  : null),
              }}
            >
              {grade ?? "·"}
            </div>
          );
        })}
      </div>
    </section>
  );
}
