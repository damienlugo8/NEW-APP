"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MealLog } from "@/lib/types/fuel";

/**
 * FUEL — single meal log row.
 *
 * Reverse-chrono list lives in the page; this just renders one entry.
 * Layout: meal name on top, time + macros in mono below. AI-generated
 * rows get a small sparkle chip so the user knows the macros came from
 * vision, not their own hand.
 */
export function FuelMealRow({ meal }: { meal: MealLog }) {
  const t = new Date(meal.loggedAt);
  const time = t.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <li className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--text)] truncate">
            {meal.mealName}
          </p>
          <p className="t-caption text-[var(--text-subtle)] mt-0.5">
            {time}
          </p>
        </div>

        {meal.aiGenerated && (
          <span
            className={cn(
              "shrink-0 inline-flex items-center gap-1 h-5 px-1.5 rounded-full",
              "bg-[var(--accent-soft)] text-[var(--accent)] text-[10px] font-semibold uppercase tracking-wide"
            )}
            title="Macros estimated by vision"
          >
            <Sparkles size={9} strokeWidth={2} />
            AI
          </span>
        )}
      </div>

      <dl className="mt-2 grid grid-cols-4 gap-2 font-mono t-num text-[12px]">
        <Macro label="kcal" value={meal.calories} />
        <Macro label="P" value={meal.proteinG} suffix="g" emphasis />
        <Macro label="C" value={meal.carbsG} suffix="g" />
        <Macro label="F" value={meal.fatG} suffix="g" />
      </dl>
    </li>
  );
}

function Macro({
  label,
  value,
  suffix = "",
  emphasis = false,
}: {
  label: string;
  value: number | null;
  suffix?: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-1">
      <dt className="text-[10px] uppercase tracking-wide text-[var(--text-subtle)]">
        {label}
      </dt>
      <dd
        className={cn(
          emphasis ? "text-[var(--accent)]" : "text-[var(--text)]"
        )}
      >
        {value ?? "—"}
        {value !== null && suffix}
      </dd>
    </div>
  );
}
