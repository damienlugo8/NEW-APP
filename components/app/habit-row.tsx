"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Dumbbell,
  BookOpen,
  PhoneOff,
  Snowflake,
  Ban,
  EyeOff,
  GlassWater,
  Mountain,
  Anvil,
  Flame,
  Check,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { HabitIcon, HabitWithToday } from "@/lib/types/habit";

const ICON_MAP: Record<HabitIcon, LucideIcon> = {
  Dumbbell,
  BookOpen,
  PhoneOff,
  Snowflake,
  Ban,
  EyeOff,
  GlassWater,
  Mountain,
  Anvil,
  Flame,
};

/**
 * Habit row — the primary tap target on /daily.
 *
 * Anatomy:
 *   [icon disc] [label]                              [checkbox]
 *
 * - Min-height 64px so the whole row is a comfortable thumb target on
 *   iPhone 13 mini (375 × 812). The checkbox itself is 28px but the entire
 *   row is the hit area.
 * - Checked state fills with ember; unchecked is hairline iron.
 * - Tap fires a layout animation (scale + ember pulse) under reduce-motion
 *   guards.
 */
export function HabitRow({
  habit,
  pending,
  onToggle,
}: {
  habit: HabitWithToday;
  pending?: boolean;
  onToggle: (next: boolean) => void;
}) {
  const reduce = useReducedMotion();
  const Icon = habit.icon ? ICON_MAP[habit.icon] : Anvil;
  const checked = habit.completed_today;

  return (
    <motion.button
      type="button"
      onClick={() => onToggle(!checked)}
      disabled={pending}
      aria-pressed={checked}
      whileTap={reduce ? undefined : { scale: 0.985 }}
      transition={{ duration: 0.12 }}
      className={cn(
        "group w-full flex items-center gap-3 px-4 py-3.5 min-h-[64px]",
        "rounded-[var(--radius-lg)] border text-left transition-colors",
        "active:bg-[var(--surface-2)]",
        checked
          ? "bg-[var(--accent-soft)] border-[var(--accent)]/45 text-[var(--text)]"
          : "bg-[var(--surface)] border-[var(--border)] text-[var(--text)] hover:border-[var(--border-strong)]",
        pending && "opacity-60 cursor-wait"
      )}
    >
      {/* Icon disc */}
      <span
        aria-hidden
        className={cn(
          "h-10 w-10 shrink-0 rounded-[10px] inline-flex items-center justify-center transition-colors",
          checked
            ? "bg-[var(--accent)]/15 text-[var(--accent)]"
            : "bg-[var(--surface-2)] text-[var(--text-subtle)] group-hover:text-[var(--text-muted)]"
        )}
      >
        <Icon size={18} strokeWidth={1.5} />
      </span>

      {/* Label */}
      <span
        className={cn(
          "flex-1 text-[15px] font-medium leading-tight",
          checked && "line-through decoration-[var(--accent)]/45 decoration-[1.5px]"
        )}
      >
        {habit.label}
      </span>

      {/* Checkbox */}
      <span
        aria-hidden
        className={cn(
          "h-7 w-7 shrink-0 rounded-[8px] border inline-flex items-center justify-center transition-all",
          checked
            ? "bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-fg)] shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent)_18%,transparent)]"
            : "border-[var(--border-strong)] bg-transparent"
        )}
      >
        {checked && <Check size={15} strokeWidth={2.5} />}
      </span>
    </motion.button>
  );
}
