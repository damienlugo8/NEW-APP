"use client";

import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The streak hero — Geist Mono numeral big enough to read across the room,
 * an ember-pulsing flame, and an "at risk" callout if today hasn't been
 * touched yet but yesterday's chain is still alive.
 *
 * Pulse only activates ≥7 days (matches PIVOT_PLAN §6: "ember reserved
 * for streaks ≥ 7 days and milestones"). Sub-7-day streaks render the
 * flame in flat ember — earned, not yet hot.
 */
export function StreakFlame({
  count,
  atRisk,
}: {
  count: number;
  atRisk: boolean;
}) {
  const hot = count >= 7;
  const cold = count === 0;

  return (
    <div className="flex items-center gap-4">
      {/* Flame */}
      <div
        className={cn(
          "relative h-14 w-14 rounded-full inline-flex items-center justify-center shrink-0",
          cold
            ? "bg-[var(--surface-2)] text-[var(--text-subtle)]"
            : "bg-[var(--accent-soft)] text-[var(--accent)]"
        )}
        aria-hidden
      >
        <Flame
          size={26}
          strokeWidth={1.5}
          fill={cold ? "none" : "currentColor"}
          className={cn(hot && "ember-pulse")}
        />
      </div>

      {/* Number + label */}
      <div className="min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span
            className={cn(
              "t-num-display tracking-[-0.04em]",
              cold ? "text-[var(--text-subtle)]" : "text-[var(--text)]"
            )}
            style={{ fontSize: "clamp(2.4rem, 9vw, 3.5rem)" }}
          >
            {count}
          </span>
          <span className="text-[13px] text-[var(--text-muted)] font-medium">
            day{count === 1 ? "" : "s"}
          </span>
        </div>
        <p
          className={cn(
            "t-caption mt-0.5",
            atRisk
              ? "text-[var(--molten)]"
              : cold
              ? "text-[var(--text-subtle)]"
              : "text-[var(--text-muted)]"
          )}
        >
          {cold
            ? "No streak — start one"
            : atRisk
            ? "At risk · log one today"
            : "Streak"}
        </p>
      </div>
    </div>
  );
}
