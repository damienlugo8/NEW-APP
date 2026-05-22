"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Flame, RotateCcw, Trophy } from "lucide-react";
import { Hard75TaskRow } from "@/components/app/hard75-task-row";
import { Hard75ProgressRuler } from "@/components/app/hard75-progress-ruler";
import { HardResetDialog } from "@/components/app/hard-reset-dialog";
import { Button } from "@/components/ui/button";
import {
  toggleTaskAction,
  hardResetAction,
  completeAction,
} from "./actions";
import {
  HARD75_DURATION,
  HARD75_REQUIRED_PER_DAY,
  HARD75_TASKS,
  type EnrollmentState,
  type Hard75TaskKey,
} from "@/lib/types/hard75";

/**
 * /hard-75 client orchestrator.
 *
 * State model:
 *   - `todayTasks` (Set<Hard75TaskKey>) is the optimistic source of truth
 *     for the day's check state. useOptimistic + a Set reducer keeps the
 *     tap responsive while the server roundtrip resolves.
 *   - history is derived from server state, with today's slot patched
 *     from the optimistic set so the progress ruler animates live.
 *
 * Two terminal flows:
 *   - Hard reset → server resets enrollment to Day 1 (history kept)
 *   - Complete → server verifies (all tasks logged today, day ≥ 75) and
 *     marks `completed`. Then we navigate to /hard-75/receipt.
 */
export function Hard75Client({
  state,
  displayName,
}: {
  state: EnrollmentState;
  displayName: string | null;
}) {
  const reduce = useReducedMotion();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Optimistic today set
  const [todaySet, setOptimistic] = useOptimistic(
    state.todayTasks,
    (prev: Set<Hard75TaskKey>, change: { key: Hard75TaskKey; next: boolean }) => {
      const out = new Set(prev);
      if (change.next) out.add(change.key);
      else out.delete(change.key);
      return out;
    }
  );

  const completedToday = todaySet.size;
  const total = HARD75_REQUIRED_PER_DAY;
  const allDone = completedToday >= total;
  const isFinalDay = state.currentDay >= HARD75_DURATION;
  const canComplete = allDone && isFinalDay && state.status === "active";

  // Patch today's slot into history so the ruler animates with taps.
  const historyForRuler = useMemo(() => {
    return state.history.map((d) =>
      d.date === state.today
        ? {
            ...d,
            completed: Array.from(todaySet),
            full: todaySet.size >= HARD75_REQUIRED_PER_DAY,
          }
        : d
    );
  }, [state.history, state.today, todaySet]);

  function handleToggle(key: Hard75TaskKey, next: boolean) {
    setErrorMsg(null);
    startTransition(async () => {
      setOptimistic({ key, next });
      const res = await toggleTaskAction(state.id, key, next);
      if (!res.ok) setErrorMsg("Couldn't save that one. Retry on next load.");
    });
  }

  function handleReset() {
    setResetting(true);
    setErrorMsg(null);
    startTransition(async () => {
      const res = await hardResetAction(state.id);
      setResetting(false);
      if (!res.ok) {
        setErrorMsg(res.error ?? "Couldn't reset.");
        return;
      }
      setResetOpen(false);
      router.refresh();
    });
  }

  function handleComplete() {
    if (!canComplete) return;
    setCompleting(true);
    setErrorMsg(null);
    startTransition(async () => {
      const res = await completeAction(state.id);
      setCompleting(false);
      if (!res.ok) {
        setErrorMsg(
          res.error === "too_early"
            ? "You're not on Day 75 yet."
            : res.error === "tasks_incomplete"
            ? "Today's tasks aren't all logged."
            : res.error ?? "Couldn't complete."
        );
        return;
      }
      router.push("/hard-75/receipt");
    });
  }

  // Status-specific paths
  if (state.status === "completed") {
    return <CompletedView state={state} displayName={displayName} />;
  }

  return (
    <div className="mx-auto max-w-[760px] px-5 lg:px-8 py-8 pb-28 lg:pb-12">
      {/* Masthead */}
      <header className="mb-7">
        <p className="t-caption text-[var(--accent)] mb-2">
          {displayName ? `Hey, ${displayName}` : "Hard 75"}
        </p>
        <h1 className="t-day-serif">
          <em>Day {state.currentDay}.</em>{" "}
          <span className="text-[var(--text)]">
            {state.currentDay === 1
              ? "Begin."
              : isFinalDay
              ? "Close it out."
              : allDone
              ? "Locked in."
              : "Stay honest."}
          </span>
        </h1>
      </header>

      {/* Today's counter card */}
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="brand-wash grain rounded-[var(--radius-lg)] border border-[var(--border)] p-5 sm:p-6 mb-5 relative overflow-hidden"
      >
        <div className="relative z-10 flex items-center justify-between gap-5">
          <div className="min-w-0">
            <p className="t-caption text-[var(--text-subtle)] mb-1">Today</p>
            <p className="text-[15px] font-medium text-[var(--text)] leading-tight">
              {allDone
                ? "All six logged."
                : `${total - completedToday} left.`}
            </p>
            <p className="t-num-mono text-xs text-[var(--text-muted)] mt-1">
              {state.hardResets > 0
                ? `${state.hardResets} hard reset${
                    state.hardResets === 1 ? "" : "s"
                  } · history kept`
                : "No resets · clean run"}
            </p>
          </div>

          {/* Big counter */}
          <motion.div
            key={completedToday}
            initial={reduce ? false : { scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-baseline gap-0 leading-none select-none"
          >
            <span
              className="font-mono font-semibold tabular-nums"
              style={{
                fontSize: "clamp(4.5rem, 18vw, 6rem)",
                letterSpacing: "-0.06em",
                color: allDone ? "var(--molten)" : "var(--text)",
                filter: allDone
                  ? "drop-shadow(0 0 28px color-mix(in oklab, var(--molten) 32%, transparent))"
                  : undefined,
                fontFeatureSettings: "'tnum' 1",
              }}
            >
              {completedToday}
            </span>
            <span
              className="font-mono tabular-nums text-[var(--text-subtle)]"
              style={{ fontSize: "clamp(2rem, 7vw, 2.75rem)", letterSpacing: "-0.04em" }}
            >
              /{total}
            </span>
          </motion.div>
        </div>
      </motion.section>

      {/* Progress ruler */}
      <div className="mb-5">
        <Hard75ProgressRuler
          history={historyForRuler}
          currentDay={state.currentDay}
        />
      </div>

      {/* Task list */}
      <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-3 sm:p-4 mb-5">
        <div className="flex items-center justify-between px-2 mb-2">
          <p className="t-caption text-[var(--text-subtle)]">Today's contract</p>
          <p className="t-num-mono text-xs text-[var(--text-muted)]">
            {completedToday}/{total}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {HARD75_TASKS.map((task) => (
            <Hard75TaskRow
              key={task.key}
              task={task}
              checked={todaySet.has(task.key)}
              onToggle={(next) => handleToggle(task.key, next)}
            />
          ))}
        </div>
        {errorMsg && (
          <p className="mt-3 px-2 text-xs text-[var(--danger)]">{errorMsg}</p>
        )}
      </section>

      {/* Day 75 complete CTA */}
      {canComplete && (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-5"
        >
          <Button
            variant="primary"
            size="lg"
            onClick={handleComplete}
            loading={completing}
            className="w-full"
          >
            {!completing && <Trophy size={16} strokeWidth={1.75} />}
            {completing ? "Sealing the receipt…" : "Claim Day 75"}
          </Button>
        </motion.div>
      )}

      {/* Footer actions */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <p className="t-caption text-[var(--text-subtle)] inline-flex items-center gap-1.5">
          <Flame size={12} strokeWidth={1.75} className="text-[var(--accent)]" />
          {HARD75_DURATION - state.currentDay} day
          {HARD75_DURATION - state.currentDay === 1 ? "" : "s"} left
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setResetOpen(true)}
          className="text-[var(--text-muted)] hover:text-[var(--molten)]"
        >
          <RotateCcw size={13} strokeWidth={1.5} />
          I missed one
        </Button>
      </div>

      <HardResetDialog
        open={resetOpen}
        currentDay={state.currentDay}
        pending={resetting}
        onClose={() => !resetting && setResetOpen(false)}
        onConfirm={handleReset}
      />
    </div>
  );
}

function CompletedView({
  state,
  displayName,
}: {
  state: EnrollmentState;
  displayName: string | null;
}) {
  return (
    <div className="mx-auto max-w-[640px] px-5 lg:px-8 py-12 pb-28 lg:pb-16 text-center">
      <p className="t-caption text-[var(--accent)] mb-2">Hard 75</p>
      <h1 className="t-display-serif text-[2.25rem] sm:text-[2.75rem] leading-[1.05] mb-4">
        <em className="text-[var(--text-muted)]">You</em>{" "}
        <span className="text-[var(--text)]">finished.</span>
      </h1>
      <p className="t-body text-[var(--text-muted)] max-w-[44ch] mx-auto mb-8">
        {displayName ? `${displayName}, you` : "You"} held the contract for 75
        days. Your receipt is waiting.
      </p>
      <a href="/hard-75/receipt">
        <Button variant="primary" size="lg">
          <Trophy size={16} strokeWidth={1.75} />
          View your receipt
        </Button>
      </a>
      <p className="t-caption text-[var(--text-subtle)] mt-6">
        Completed {state.completedAt ?? state.today}
      </p>
    </div>
  );
}
