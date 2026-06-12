"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
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

  // Protein is a goal you HIT (ember + check). Calories is a ceiling you
  // BLOW PAST (red the moment you cross target).
  const proteinHit = totals.proteinG >= targets.proteinG;
  const calorieOver = totals.calories > targets.calories;

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
        hit={proteinHit}
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
  hit = false,
  reduce,
}: {
  label: string;
  unit: string;
  value: number;
  target: number;
  pct: number;
  hero?: boolean;
  warn?: boolean;
  hit?: boolean;
  reduce: boolean;
}) {
  // Bar/number color: red when over a ceiling, ember when a goal is hit,
  // otherwise the neutral accent fill / default text.
  const numberColor = warn ? "var(--danger)" : hit ? "var(--accent)" : undefined;
  const barColor = warn ? "var(--danger)" : "var(--accent)";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[var(--radius)] border border-[var(--border)]",
        "bg-[var(--surface)] px-5 py-4 sm:px-6",
        hero ? "py-6" : ""
      )}
    >
      <div className="flex items-baseline justify-between">
        <p className="t-caption text-[var(--text-subtle)] inline-flex items-center gap-1.5">
          {label}
          {hit && (
            <motion.span
              initial={reduce ? false : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex h-4 w-4 items-center justify-center rounded-full"
              style={{ background: "var(--accent)" }}
              aria-label="Target hit"
            >
              <Check size={10} strokeWidth={3} color="#fff" />
            </motion.span>
          )}
        </p>
        <p className="text-[11px] font-mono text-[var(--text-subtle)] t-num">
          target {target.toLocaleString()}{unit}
        </p>
      </div>

      <div
        className={cn(
          "mt-1 flex items-baseline gap-1 font-mono t-num leading-none",
          hero ? "text-[64px] sm:text-[80px]" : "text-[40px] sm:text-[48px]",
          numberColor ? "" : "text-[var(--text)]"
        )}
        style={numberColor ? { color: numberColor } : undefined}
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
        className={cn(
          "mt-3 rounded-full bg-[var(--surface-2)] overflow-hidden",
          hero ? "h-2.5" : "h-2"
        )}
        aria-hidden
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: barColor }}
          initial={reduce ? false : { width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}
