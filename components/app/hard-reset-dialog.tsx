"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Hard Reset confirmation — the brutal honesty dialog.
 *
 * Why hold-to-confirm rather than a second tap: the action is destructive
 * (resets currentDay to 1, bumps hard_resets, keeps history). A 2-second
 * press is friction proportional to consequence — it interrupts the
 * thumb-instinct "yeah, sure" that would let users tap through it.
 *
 * Accessibility: the hold mechanism is mirrored by a regular keyboard
 * Enter/Space that triggers immediately when the button has focus — we're
 * not gatekeeping screen-reader users behind a gesture they can't see.
 */
const HOLD_MS = 2000;

export function HardResetDialog({
  open,
  currentDay,
  pending,
  onClose,
  onConfirm,
}: {
  open: boolean;
  currentDay: number;
  pending?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const reduce = useReducedMotion();
  const [progress, setProgress] = useState(0); // 0..1
  const holdStart = useRef<number | null>(null);
  const raf = useRef<number | null>(null);

  // Reset state when the dialog opens/closes
  useEffect(() => {
    if (!open) {
      cancelHold();
      setProgress(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function tick() {
    if (holdStart.current == null) return;
    const elapsed = performance.now() - holdStart.current;
    const p = Math.min(1, elapsed / HOLD_MS);
    setProgress(p);
    if (p >= 1) {
      cancelHold();
      onConfirm();
      return;
    }
    raf.current = requestAnimationFrame(tick);
  }

  function startHold() {
    if (pending) return;
    holdStart.current = performance.now();
    raf.current = requestAnimationFrame(tick);
  }

  function cancelHold() {
    if (raf.current != null) cancelAnimationFrame(raf.current);
    raf.current = null;
    holdStart.current = null;
    setProgress(0);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {/* Scrim */}
          <button
            type="button"
            aria-label="Dismiss"
            onClick={onClose}
            className="absolute inset-0 bg-[color-mix(in_oklab,var(--bg)_72%,transparent)] backdrop-blur-sm"
          />

          <motion.div
            initial={reduce ? false : { y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { y: 24, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "relative w-full sm:max-w-[440px] sm:rounded-[var(--radius-lg)]",
              "rounded-t-[var(--radius-lg)] border border-[var(--border)]",
              "bg-[var(--surface)] grain overflow-hidden",
              "shadow-[var(--shadow-md)]"
            )}
          >
            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute top-3 right-3 h-8 w-8 inline-flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-subtle)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition-colors"
            >
              <X size={16} strokeWidth={1.5} />
            </button>

            <div className="p-6 sm:p-7">
              <div className="flex items-start gap-3 mb-4">
                <span
                  className="h-10 w-10 shrink-0 rounded-[10px] inline-flex items-center justify-center bg-[color-mix(in_oklab,var(--molten)_18%,transparent)] text-[var(--molten)]"
                  aria-hidden
                >
                  <AlertTriangle size={18} strokeWidth={1.75} />
                </span>
                <div className="min-w-0">
                  <h3
                    id="reset-title"
                    className="t-day-serif text-[1.5rem] leading-[1.1]"
                  >
                    <em className="text-[var(--text-muted)]">Reset</em>{" "}
                    <span className="text-[var(--text)]">to Day 1.</span>
                  </h3>
                  <p className="t-caption text-[var(--text-subtle)] mt-1">
                    Currently on Day {currentDay}
                  </p>
                </div>
              </div>

              <p className="t-body text-[var(--text-muted)] mb-5 leading-relaxed">
                You missed a task. The rules of Hard 75 are clear — the count
                goes back to one. Your history stays. Hold the button below
                for two seconds to confirm.
              </p>

              {/* Hold-to-confirm button */}
              <button
                type="button"
                disabled={pending}
                onMouseDown={startHold}
                onMouseUp={cancelHold}
                onMouseLeave={cancelHold}
                onTouchStart={startHold}
                onTouchEnd={cancelHold}
                onTouchCancel={cancelHold}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onConfirm();
                  }
                }}
                className={cn(
                  "relative w-full h-14 rounded-[var(--radius)] overflow-hidden",
                  "border border-[var(--molten)]/45",
                  "bg-[color-mix(in_oklab,var(--molten)_10%,transparent)]",
                  "text-[var(--molten)] font-semibold text-[15px]",
                  "transition-colors select-none",
                  "hover:bg-[color-mix(in_oklab,var(--molten)_16%,transparent)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--molten)]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]",
                  pending && "opacity-60 cursor-wait"
                )}
              >
                {/* Progress fill */}
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 bg-[var(--molten)]/85 transition-[width] duration-75 ease-linear"
                  style={{ width: `${progress * 100}%` }}
                />
                <span
                  className={cn(
                    "relative z-10 inline-flex items-center gap-2 transition-colors",
                    progress > 0.5 && "text-[var(--bg)]"
                  )}
                >
                  {progress > 0
                    ? progress >= 1
                      ? "Reset"
                      : "Hold…"
                    : "Hold to reset"}
                </span>
              </button>

              <div className="mt-4 flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  disabled={pending}
                >
                  Never mind
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
