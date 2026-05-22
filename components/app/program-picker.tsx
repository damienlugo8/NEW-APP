"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Anvil, X, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PROGRAMS, type ProgramEnrollment, type ProgramKey } from "@/lib/types/habit";

/**
 * Program selector — opens as a bottom sheet on mobile, a centered modal on
 * lg+. Lists the three launch programs (Hard 75, Monk Mode 30, Forge
 * Custom) with their tagline + duration. Tapping a card calls the server
 * action and closes the sheet on success.
 *
 * If the user already has an active program, the entry button on the page
 * shows the program name; tapping it opens this same sheet so they can
 * switch (with a confirm step) or abandon.
 */
export function ProgramPickerEntry({
  enrollment,
  onStart,
}: {
  enrollment: ProgramEnrollment | null;
  onStart: (key: ProgramKey) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const reduce = useReducedMotion();

  const active = enrollment;
  const activeProgram = active
    ? PROGRAMS.find((p) => p.key === active.program_key)
    : null;

  function handleStart(key: ProgramKey) {
    setError(null);
    startTransition(async () => {
      const res = await onStart(key);
      if (!res.ok) setError(res.error ?? "Couldn't start program.");
      else setOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "w-full flex items-center gap-3 rounded-[var(--radius-lg)] border p-4 text-left transition-colors",
          active
            ? "border-[var(--accent)]/40 bg-[var(--accent-soft)] hover:border-[var(--accent)]/60"
            : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)]"
        )}
      >
        <span
          aria-hidden
          className={cn(
            "h-10 w-10 rounded-[10px] inline-flex items-center justify-center shrink-0",
            active
              ? "bg-[var(--accent)] text-[var(--accent-fg)]"
              : "bg-[var(--surface-2)] text-[var(--text-subtle)]"
          )}
        >
          <Anvil size={18} strokeWidth={1.5} />
        </span>
        <div className="min-w-0 flex-1">
          {active && activeProgram ? (
            <>
              <p className="t-caption text-[var(--accent)]">
                {activeProgram.name}
              </p>
              <p className="text-[15px] font-medium text-[var(--text)] leading-tight mt-0.5">
                Day{" "}
                <span className="t-num-mono">{active.current_day}</span> of{" "}
                <span className="t-num-mono">{activeProgram.duration_days}</span>
                {active.hard_resets > 0 && (
                  <span className="text-[var(--text-muted)] font-normal">
                    {" "}
                    · <span className="t-num-mono">{active.hard_resets}</span>{" "}
                    reset{active.hard_resets === 1 ? "" : "s"}
                  </span>
                )}
              </p>
            </>
          ) : (
            <>
              <p className="t-caption text-[var(--text-subtle)]">Programs</p>
              <p className="text-[15px] font-medium text-[var(--text)] leading-tight mt-0.5">
                Start a program
              </p>
            </>
          )}
        </div>
        <ArrowRight
          size={16}
          strokeWidth={1.5}
          className={cn(
            "shrink-0",
            active ? "text-[var(--accent)]" : "text-[var(--text-subtle)]"
          )}
          aria-hidden
        />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              aria-hidden
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Pick a program"
              initial={{
                opacity: 0,
                y: reduce ? 0 : 24,
              }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduce ? 0 : 24 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "fixed z-50 left-0 right-0 bottom-0",
                "lg:left-1/2 lg:right-auto lg:bottom-auto lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-[560px]",
                "rounded-t-[var(--radius-xl)] lg:rounded-[var(--radius-xl)]",
                "bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-lg)]",
                "max-h-[88vh] overflow-y-auto"
              )}
            >
              {/* Sheet handle (mobile only) */}
              <div className="lg:hidden flex justify-center pt-3 pb-1">
                <span className="h-1 w-10 rounded-full bg-[var(--border-strong)]" aria-hidden />
              </div>

              <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 lg:pt-6">
                <div>
                  <p className="t-caption text-[var(--accent)] mb-1">Programs</p>
                  <h2 className="t-h2">Pick your discipline.</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="h-8 w-8 inline-flex items-center justify-center rounded-[var(--radius)] text-[var(--text-subtle)] hover:bg-[var(--surface-2)]"
                  aria-label="Close"
                >
                  <X size={16} strokeWidth={1.5} />
                </button>
              </div>

              <div className="px-5 pb-6 lg:pb-8 flex flex-col gap-3">
                {PROGRAMS.map((p) => {
                  const isActive = active?.program_key === p.key;
                  return (
                    <button
                      key={p.key}
                      type="button"
                      disabled={pending || isActive}
                      onClick={() => handleStart(p.key as ProgramKey)}
                      className={cn(
                        "text-left rounded-[var(--radius-lg)] border p-4 transition-colors",
                        "hover:border-[var(--accent)]/50",
                        isActive
                          ? "border-[var(--accent)]/45 bg-[var(--accent-soft)]"
                          : "border-[var(--border)] bg-[var(--surface)]",
                        pending && "opacity-60 cursor-wait"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div className="flex items-baseline gap-2">
                          <h3 className="text-[17px] font-semibold tracking-tight">
                            {p.name}
                          </h3>
                          <span className="t-num-mono text-xs text-[var(--text-subtle)]">
                            {p.duration_days}d
                          </span>
                        </div>
                        {isActive && (
                          <span className="t-caption text-[var(--accent)] inline-flex items-center gap-1">
                            <Check size={11} strokeWidth={2.5} /> Active
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[var(--text-muted)] mb-2">
                        {p.tagline}
                      </p>
                      <p className="text-xs text-[var(--text-subtle)] leading-relaxed">
                        {p.description}
                      </p>
                    </button>
                  );
                })}

                {error && (
                  <p className="text-sm text-[var(--danger)] mt-1">{error}</p>
                )}

                {active && (
                  <p className="text-[11px] text-[var(--text-subtle)] mt-2 leading-relaxed">
                    Switching abandons your active{" "}
                    <span className="font-medium text-[var(--text-muted)]">
                      {activeProgram?.name}
                    </span>{" "}
                    enrollment at day{" "}
                    <span className="t-num-mono">{active.current_day}</span>.
                  </p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
