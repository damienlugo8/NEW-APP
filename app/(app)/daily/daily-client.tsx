"use client";

import { useOptimistic, useState, useTransition } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { HabitRow } from "@/components/app/habit-row";
import { StreakFlame } from "@/components/app/streak-flame";
import { DayRating } from "@/components/app/day-rating";
import { CalendarHistory } from "@/components/app/calendar-history";
import { ProgramPickerEntry } from "@/components/app/program-picker";
import { toggleHabitAction, startProgramAction } from "./actions";
import {
  calculateStreak,
  type DayRecord,
  type HabitWithToday,
  type ProgramEnrollment,
  type ProgramKey,
} from "@/lib/types/habit";

/**
 * DAILY — client orchestrator.
 *
 * Optimistic UI for the habit toggle: when the user taps, we flip the
 * `completed_today` flag locally with useOptimistic and fire the server
 * action in the background. If the action fails, the optimistic state is
 * automatically reverted on the next render (useOptimistic semantics).
 *
 * Streak + today's count are recomputed from the optimistic list, so the
 * rating letter and streak number animate in real time.
 */
export function DailyClient({
  initialHabits,
  initialHistory,
  initialEnrollment,
  today,
  displayName,
}: {
  initialHabits: HabitWithToday[];
  initialHistory: DayRecord[];
  initialEnrollment: ProgramEnrollment | null;
  today: string;
  displayName: string | null;
}) {
  const reduce = useReducedMotion();
  const [, startTransition] = useTransition();
  const [errorId, setErrorId] = useState<string | null>(null);

  const [habits, setOptimistic] = useOptimistic(
    initialHabits,
    (state: HabitWithToday[], change: { id: string; next: boolean }) =>
      state.map((h) =>
        h.id === change.id ? { ...h, completed_today: change.next } : h
      )
  );

  function handleToggle(id: string, next: boolean) {
    setErrorId(null);
    startTransition(async () => {
      setOptimistic({ id, next });
      const res = await toggleHabitAction(id, next);
      if (!res.ok) setErrorId(id);
    });
  }

  async function handleStartProgram(key: ProgramKey) {
    return startProgramAction(key);
  }

  // Derived metrics (optimistic-aware)
  const completedToday = habits.filter((h) => h.completed_today).length;
  const totalToday = habits.length;

  // Splice today's completion count into the history so streak math
  // reflects the live tap state.
  const historyWithLive: DayRecord[] = initialHistory.map((d) =>
    d.date === today
      ? { ...d, completed: completedToday, total: totalToday }
      : d
  );
  const { count: streak, atRisk } = calculateStreak(historyWithLive, today);

  // Greeting line — Day N if enrolled, otherwise time-of-day
  const greeting = (() => {
    if (initialEnrollment) {
      return {
        accent: `Day ${initialEnrollment.current_day}.`,
        body: "Lock in.",
      };
    }
    const hr = new Date().getHours();
    if (hr < 12) return { accent: "Morning.", body: "Make today count." };
    if (hr < 18) return { accent: "Afternoon.", body: "Keep moving." };
    return { accent: "Evening.", body: "Close it out." };
  })();

  return (
    <div className="mx-auto max-w-[760px] px-5 lg:px-8 py-8 pb-28 lg:pb-12">
      {/* Greeting masthead */}
      <header className="mb-7">
        <p className="t-caption text-[var(--text-muted)] mb-2">
          {displayName ? `Hey, ${displayName}` : "FORGE"}
        </p>
        <h1 className="t-day-serif">
          <em>{greeting.accent}</em>{" "}
          <span className="text-[var(--text)]">{greeting.body}</span>
        </h1>
      </header>

      {/* Hero card: streak + grade */}
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="brand-wash grain rounded-[var(--radius-lg)] border border-[var(--border)] p-5 sm:p-6 mb-6 relative overflow-hidden"
      >
        <div className="relative z-10 flex flex-col gap-5">
          <StreakFlame count={streak} atRisk={atRisk} />
          <div className="divider-soft" />
          <DayRating completed={completedToday} total={totalToday} />
        </div>
      </motion.section>

      {/* Program entry */}
      <div id="programs" className="mb-6">
        <ProgramPickerEntry
          enrollment={initialEnrollment}
          onStart={handleStartProgram}
        />
      </div>

      {/* Habit list — or the Day 1 editorial empty state */}
      {totalToday === 0 ? (
        <section className="mb-6 rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] px-5 sm:px-6 py-16 sm:py-20 text-center">
          <h2 className="t-h2-serif text-[var(--text)]">Day 1.</h2>
          <p className="t-small text-[var(--text-muted)] mt-3">
            Build your first habit.
          </p>
          <a
            href="#programs"
            className="mt-8 inline-flex h-11 items-center justify-center rounded-[var(--radius)] bg-[var(--accent)] px-6 text-sm font-semibold tracking-[-0.01em] text-[var(--accent-fg)] transition-transform duration-200 active:scale-[0.97]"
          >
            Choose a program
          </a>
        </section>
      ) : (
        <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-3 sm:p-4 mb-6">
          <div className="flex items-center justify-between px-2 mb-2">
            <p className="t-caption text-[var(--text-subtle)]">
              Today's tasks
            </p>
            <p className="t-num-mono text-xs text-[var(--text-muted)]">
              {completedToday}/{totalToday}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {habits.map((h) => (
              <HabitRow
                key={h.id}
                habit={h}
                pending={false}
                onToggle={(next) => handleToggle(h.id, next)}
              />
            ))}
          </div>
          {errorId && (
            <p className="mt-3 px-2 text-xs text-[var(--danger)]">
              Couldn't save that one. We'll retry on the next load.
            </p>
          )}
        </section>
      )}

      {/* History */}
      <CalendarHistory history={historyWithLive} />
    </div>
  );
}
