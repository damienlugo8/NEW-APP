"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  gradeColor,
  gradeForCompletion,
  gradeLabel,
  type Grade,
} from "@/lib/types/habit";

/**
 * The 120px letter. Geist Mono, tabular-nums, color-coded by grade.
 *
 * On mobile (375px) it floors at 96px so it stays the biggest element
 * on screen. On md+ it hits the brief's 120px target.
 * The letter is the entire visual hero of this card — no chrome, no
 * border. Color does the work.
 */
export function DayRating({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const reduce = useReducedMotion();
  const grade: Grade = gradeForCompletion(completed, total);
  const color = gradeColor(grade);
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className="flex items-center justify-between gap-5">
      <div className="min-w-0">
        <p className="t-caption text-[var(--text-subtle)] mb-1">Today's rating</p>
        <p className="text-[15px] font-medium text-[var(--text)] leading-tight">
          {gradeLabel(grade)}
        </p>
        <p className="t-num-mono text-xs text-[var(--text-muted)] mt-1">
          {completed} of {total} · {pct}%
        </p>
      </div>

      <motion.span
        key={grade}
        initial={reduce ? false : { scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        aria-label={`Grade ${grade}`}
        className="font-mono font-semibold tabular-nums leading-none select-none"
        style={{
          color,
          // ≥96px on mobile — the letter is the biggest element on /daily.
          fontSize: "clamp(6rem, 24vw, 7.5rem)",
          letterSpacing: "-0.06em",
          fontFeatureSettings: "'tnum' 1, 'ss01' 1, 'cv11' 1",
          filter:
            "drop-shadow(0 0 24px color-mix(in oklab, currentColor 30%, transparent))",
        }}
      >
        {grade}
      </motion.span>
    </div>
  );
}
