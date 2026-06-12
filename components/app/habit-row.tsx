"use client";

import { useRef } from "react";
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
 * - Checked state fills with ember; unchecked is hairline iron. The label
 *   gets BOTH the strike-through and 0.4 opacity — done is done.
 * - Tapping a habit complete fires a ~300ms ember pulse out of the
 *   checkbox (skipped on first paint and under reduced motion).
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

  // Gate the check pulse so habits already completed on page load don't
  // all pulse at once — only user taps within this session fire it.
  const interacted = useRef(false);

  return (
    <motion.button
      type="button"
      onClick={() => {
        interacted.current = true;
        onToggle(!checked);
      }}
      disabled={pending}
      aria-pressed={checked}
      whileTap={reduce ? undefined : { scale: 0.985 }}
      transition={{ duration: 0.12 }}
      className={cn(
        "group w-full flex items-center gap-3 px-4 py-3.5 min-h-[64px]",
        "rounded-[var(--radius-lg)] border text-left transition-colors",
        "active:bg-[var(--surface-2)]",
        checked
          ? "bg-[var(--accent-soft)] text-[var(--text)]"
          : "bg-[var(--surface)] border-[var(--border)] text-[var(--text)] hover:border-[var(--border-strong)]",
        pending && "opacity-60 cursor-wait"
      )}
      style={
        checked
          ? {
              borderColor:
                "color-mix(in oklab, var(--accent) 45%, transparent)",
            }
          : undefined
      }
    >
      {/* Icon disc */}
      <span
        aria-hidden
        className={cn(
          "h-10 w-10 shrink-0 rounded-[var(--radius)] inline-flex items-center justify-center transition-colors",
          checked
            ? "text-[var(--accent)]"
            : "bg-[var(--surface-2)] text-[var(--text-subtle)] group-hover:text-[var(--text-muted)]"
        )}
        style={
          checked
            ? {
                backgroundColor:
                  "color-mix(in oklab, var(--accent) 15%, transparent)",
              }
            : undefined
        }
      >
        <Icon size={18} strokeWidth={1.5} />
      </span>

      {/* Label — strike-through AND faded when done */}
      <span
        className={cn(
          "flex-1 text-[15px] font-medium leading-tight transition-opacity duration-200",
          checked && "line-through decoration-[1.5px]"
        )}
        style={
          checked
            ? {
                opacity: 0.4,
                textDecorationColor:
                  "color-mix(in oklab, var(--accent) 60%, transparent)",
              }
            : undefined
        }
      >
        {habit.label}
      </span>

      {/* Checkbox */}
      <span
        aria-hidden
        className={cn(
          "relative h-7 w-7 shrink-0 rounded-[8px] border inline-flex items-center justify-center transition-all",
          checked
            ? "bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-fg)]"
            : "border-[var(--border-strong)] bg-transparent"
        )}
        style={
          checked
            ? {
                boxShadow:
                  "0 0 0 3px color-mix(in oklab, var(--accent) 18%, transparent)",
              }
            : undefined
        }
      >
        {/* Ember pulse — rides the check, fades out over ~300ms */}
        {checked && interacted.current && !reduce && (
          <motion.span
            aria-hidden
            initial={{ opacity: 0.6, scale: 0.6 }}
            animate={{ opacity: 0, scale: 2 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 rounded-[8px] pointer-events-none"
            style={{
              backgroundColor:
                "color-mix(in oklab, var(--accent) 40%, transparent)",
            }}
          />
        )}
        {checked && <Check size={15} strokeWidth={2.5} />}
      </span>
    </motion.button>
  );
}
