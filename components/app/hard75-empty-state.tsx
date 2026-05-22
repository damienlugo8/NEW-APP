"use client";

import { useTransition } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Anvil, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HARD75_TASKS, HARD75_DURATION } from "@/lib/types/hard75";

/**
 * Hard 75 — "Are you ready?" empty state.
 *
 * Shown when the user has never enrolled (or has only abandoned/failed
 * enrollments). This is the wedge moment — the page that decides whether
 * someone signs the contract.
 *
 * Treatment: editorial. The CTA is a single button, the contract is the
 * full task list rendered as a signed-document feel. No marketing copy,
 * no testimonials, no FAQ. The brief says "Forge yourself. Daily." and
 * leaves a long pause for the user to decide for themselves.
 */
export function Hard75EmptyState({
  onEnroll,
}: {
  onEnroll: () => Promise<{ ok: boolean; error?: string }>;
}) {
  const reduce = useReducedMotion();
  const [pending, start] = useTransition();

  function handleStart() {
    start(async () => {
      await onEnroll();
    });
  }

  return (
    <div className="mx-auto max-w-[640px] px-5 lg:px-8 py-10 pb-28 lg:pb-16">
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="brand-wash grain rounded-[var(--radius-lg)] border border-[var(--border)] p-7 sm:p-10 mb-6 relative overflow-hidden"
      >
        <div className="relative z-10 text-center">
          <span
            className="inline-flex items-center justify-center h-14 w-14 rounded-[12px] bg-[var(--accent-soft)] text-[var(--accent)] mb-6"
            aria-hidden
          >
            <Anvil size={22} strokeWidth={1.5} />
          </span>

          <p className="t-caption text-[var(--accent)] mb-2">
            The contract · {HARD75_DURATION} days
          </p>

          <h1 className="t-display-serif text-[2.25rem] sm:text-[2.75rem] leading-[1.05] mb-4">
            <em className="text-[var(--text-muted)]">Are you</em>{" "}
            <span className="text-[var(--text)]">ready?</span>
          </h1>

          <p className="t-body text-[var(--text-muted)] max-w-[44ch] mx-auto leading-relaxed">
            {HARD75_TASKS.length} tasks every day for {HARD75_DURATION} days.
            Miss one — back to Day 1. No cheat meals, no skipped workouts,
            no almosts. Your history is kept either way.
          </p>
        </div>
      </motion.section>

      {/* The contract */}
      <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 mb-6">
        <p className="t-caption text-[var(--text-subtle)] mb-4">
          Every day, you will:
        </p>
        <ul className="flex flex-col gap-3">
          {HARD75_TASKS.map((t) => {
            const Icon = t.icon;
            return (
              <li
                key={t.key}
                className="flex items-start gap-3 text-[var(--text)]"
              >
                <span
                  aria-hidden
                  className="h-8 w-8 shrink-0 rounded-[8px] bg-[var(--surface-2)] text-[var(--text-muted)] inline-flex items-center justify-center"
                >
                  <Icon size={15} strokeWidth={1.5} />
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-[15px] font-medium leading-tight">
                    {t.label}
                  </p>
                  <p className="t-caption text-[var(--text-subtle)] mt-0.5">
                    {t.hint}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* CTA */}
      <div className="flex flex-col items-center gap-3">
        <Button
          variant="primary"
          size="lg"
          onClick={handleStart}
          loading={pending}
          className="w-full sm:w-auto sm:min-w-[280px]"
        >
          {pending ? "Lighting the forge…" : (
            <>
              I'm ready. Start Day 1.
              <ArrowRight size={16} strokeWidth={1.75} />
            </>
          )}
        </Button>
        <p className="t-caption text-[var(--text-subtle)] flex items-center gap-1.5">
          <Check size={11} strokeWidth={2} />
          Starts today · resets are on you
        </p>
      </div>
    </div>
  );
}
