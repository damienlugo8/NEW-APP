"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Hard75Task } from "@/lib/types/hard75";

/**
 * Hard75TaskRow — the daily task tile.
 *
 * Same anatomy as HabitRow on /daily, with two refinements specific to a
 * fixed-program context:
 *   - A small hint line under the label (the rule of the task — "45 min",
 *     "128 oz") that reminds the user what they're signing for before they
 *     check the box. The brief's "no cheat meals" energy.
 *   - Slightly taller (72px min) to hold the hint without crowding.
 */
export function Hard75TaskRow({
  task,
  checked,
  pending,
  disabled,
  onToggle,
}: {
  task: Hard75Task;
  checked: boolean;
  pending?: boolean;
  disabled?: boolean;
  onToggle: (next: boolean) => void;
}) {
  const reduce = useReducedMotion();
  const Icon = task.icon;

  return (
    <motion.button
      type="button"
      onClick={() => !disabled && onToggle(!checked)}
      disabled={pending || disabled}
      aria-pressed={checked}
      whileTap={reduce || disabled ? undefined : { scale: 0.985 }}
      transition={{ duration: 0.12 }}
      className={cn(
        "group w-full flex items-center gap-3 px-4 py-3.5 min-h-[72px]",
        "rounded-[var(--radius-lg)] border text-left transition-colors",
        "active:bg-[var(--surface-2)]",
        checked
          ? "bg-[var(--accent-soft)] border-[var(--accent)]/45 text-[var(--text)]"
          : "bg-[var(--surface)] border-[var(--border)] text-[var(--text)] hover:border-[var(--border-strong)]",
        pending && "opacity-60 cursor-wait",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
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

      <span className="flex-1 min-w-0">
        <span
          className={cn(
            "block text-[15px] font-medium leading-tight",
            checked &&
              "line-through decoration-[var(--accent)]/45 decoration-[1.5px]"
          )}
        >
          {task.label}
        </span>
        <span className="block t-caption text-[var(--text-subtle)] mt-1 truncate">
          {task.hint}
        </span>
      </span>

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
