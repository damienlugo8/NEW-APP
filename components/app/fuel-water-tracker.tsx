"use client";

import { useOptimistic, useTransition } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Plus, Undo2, Droplet } from "lucide-react";
import { cn } from "@/lib/utils";
import { GALLON_OZ, WATER_POUR_OZ } from "@/lib/types/fuel";

/**
 * FUEL — water tracker.
 *
 * Sixteen 8oz cells laid out as a single row. Tap [+8oz] to fill the next
 * one; the last filled one can be undone. Cell 16 is the gallon line —
 * the same threshold that auto-completes the Hard 75 water task server-side.
 *
 * Optimistic: taps render the next cell immediately via useOptimistic so
 * the action feels instant. Server reconciles on revalidate.
 */
export function FuelWaterTracker({
  filledCount,
  onPour,
  onUndo,
}: {
  filledCount: number;          // server truth — # of pours today
  onPour: () => Promise<{ ok: boolean; error?: string }>;
  onUndo: () => Promise<{ ok: boolean; error?: string }>;
}) {
  const reduce = useReducedMotion();
  const [, startTransition] = useTransition();
  const cellCount = GALLON_OZ / WATER_POUR_OZ;       // 16

  const [optimisticCount, applyOptimistic] = useOptimistic(
    filledCount,
    (prev: number, delta: number) => Math.max(0, Math.min(cellCount, prev + delta))
  );

  function handlePour() {
    startTransition(async () => {
      applyOptimistic(1);
      await onPour();
    });
  }

  function handleUndo() {
    if (optimisticCount <= 0) return;
    startTransition(async () => {
      applyOptimistic(-1);
      await onUndo();
    });
  }

  const goalHit = optimisticCount >= cellCount;

  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-5 py-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Droplet
            size={14}
            strokeWidth={1.5}
            className={cn(
              goalHit ? "text-[var(--accent)]" : "text-[var(--text-subtle)]"
            )}
          />
          <p className="t-caption text-[var(--text-subtle)]">
            Water — {optimisticCount * WATER_POUR_OZ}oz of {GALLON_OZ}oz
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleUndo}
            disabled={optimisticCount <= 0}
            aria-label="Undo last pour"
            className={cn(
              "h-7 w-7 inline-flex items-center justify-center rounded-[var(--radius-sm)]",
              "text-[var(--text-subtle)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]",
              "disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed",
              "transition-colors"
            )}
          >
            <Undo2 size={13} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={handlePour}
            disabled={goalHit}
            aria-label="Add 8 oz"
            className={cn(
              "h-7 inline-flex items-center gap-1 px-2.5 rounded-[var(--radius-sm)]",
              "bg-[var(--accent-soft)] text-[var(--accent)] text-[12px] font-semibold",
              "hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed",
              "transition"
            )}
          >
            <Plus size={12} strokeWidth={2.25} />
            <span className="t-num">8 oz</span>
          </button>
        </div>
      </div>

      {/* 16-cell row */}
      <div
        role="meter"
        aria-valuenow={optimisticCount}
        aria-valuemin={0}
        aria-valuemax={cellCount}
        className="grid gap-[3px]"
        style={{ gridTemplateColumns: `repeat(${cellCount}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: cellCount }, (_, i) => {
          const filled = i < optimisticCount;
          return (
            <motion.span
              key={i}
              className={cn(
                "h-3 rounded-[2px]",
                filled ? "bg-[var(--accent)]" : "bg-[var(--surface-2)]"
              )}
              initial={false}
              animate={
                reduce
                  ? { opacity: 1 }
                  : filled
                  ? { opacity: 1, scaleY: 1 }
                  : { opacity: 0.55, scaleY: 0.7 }
              }
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              aria-hidden
            />
          );
        })}
      </div>

      {goalHit && (
        <p className="mt-3 text-[11px] font-mono t-num text-[var(--accent)] uppercase tracking-wide">
          Gallon down. Hard 75 water task — auto-logged.
        </p>
      )}
    </div>
  );
}
