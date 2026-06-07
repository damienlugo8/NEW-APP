"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { clampPct, type MacroTargets } from "@/lib/types/fuel";

/**
 * FUEL — macro dashboard.
 *
 * Three numbers, one priority order: protein (the hero), calories, water.
 * Each number is a Geist Mono current/target pair with an animated fill bar
 * underneath. Bar caps at 100% but the number keeps counting past target,
 * so the user always sees the truth ("I went over"). Color shifts to red
 * if calories blow past target by 15% — the only chromatic alarm.
 *
 * Protein gets the biggest number and the most vertical space because that's
 * the macro that actually decides body composition. Calories and water are
 * supporting cast.
 */

interface MacroDashboardProps {
  targets: MacroTargets;
  totals: { proteinG: number; calories: number; waterOz: number };
}

export function FuelMacroDashboard({ targets, totals }: MacroDashboardProps) {
  const reduce = useReducedMotion();

  const proteinPct = clampPct(totals.proteinG, targets.proteinG);
  const caloriePct = clampPct(totals.calories, targets.calories);
  const waterPct = clampPct(totals.waterOz, targets.waterOz);

  const calorieOver = totals.calories > targets.calories * 1.15;

  return (
    <section
      aria-label="Today's macros"
      className="grid grid-cols-1 gap-3"
    >
      {/* Protein — hero */}
      <Tile
        label="Protein"
        unit="g"
        value={totals.proteinG}
        target={targets.proteinG}
        pct={proteinPct}
        hero
        reduce={!!reduce}
      />

      {/* Calories + water side-by-side on lg, stacked on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Tile
          label="Calories"
          unit="kcal"
          value={totals.calories}
          target={targets.calories}
          pct={caloriePct}
          warn={calorieOver}
          reduce={!!reduce}
        />
        <Tile
          label="Water"
          unit="oz"
          value={totals.waterOz}
          target={targets.waterOz}
          pct={waterPct}
          reduce={!!reduce}
        />
      </div>
    </section>
  );
}

function Tile({
  label,
  unit,
  value,
  target,
  pct,
  hero = false,
  warn = false,
  reduce,
}: {
  label: string;
  unit: string;
  value: number;
  target: number;
  pct: number;
  hero?: boolean;
  warn?: boolean;
  reduce: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[var(--radius)] border border-[var(--border)]",
        "bg-[var(--surface)] px-5 py-4",
        hero ? "py-6" : ""
      )}
    >
      <div className="flex items-baseline justify-between">
        <p className="t-caption text-[var(--text-subtle)]">{label}</p>
        <p className="text-[11px] font-mono text-[var(--text-subtle)] t-num">
          target {target.toLocaleString()}{unit}
        </p>
      </div>

      <div
        className={cn(
          "mt-1 flex items-baseline gap-1 font-mono t-num leading-none",
          hero ? "text-[64px] sm:text-[80px]" : "text-[40px] sm:text-[48px]",
          warn ? "text-[var(--danger,#dc2626)]" : "text-[var(--text)]"
        )}
      >
        <span>{value.toLocaleString()}</span>
        <span
          className={cn(
            "text-[var(--text-subtle)]",
            hero ? "text-[20px]" : "text-[14px]"
          )}
        >
          {unit}
        </span>
      </div>

      <div
        className="mt-3 h-1 rounded-full bg-[var(--surface-2)] overflow-hidden"
        aria-hidden
      >
        <motion.div
          className={cn(
            "h-full rounded-full",
            warn ? "bg-[var(--danger,#dc2626)]" : "bg-[var(--accent)]"
          )}
          initial={reduce ? false : { width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}
