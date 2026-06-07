"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FuelMacroDashboard } from "@/components/app/fuel-macro-dashboard";
import { FuelWaterTracker } from "@/components/app/fuel-water-tracker";
import { FuelMealRow } from "@/components/app/fuel-meal-row";
import { FuelLogMealSheet } from "@/components/app/fuel-log-meal-sheet";
import { WATER_POUR_OZ, type FuelDayState, type MealInput } from "@/lib/types/fuel";
import { logMealAction, pourWaterAction, undoWaterAction } from "./actions";

/**
 * /fuel client orchestrator.
 *
 * Holds the open/close state for the meal sheet and wires the server
 * actions through. Macro totals + water totals come from server state
 * via the page; this component re-renders on revalidate.
 *
 * Empty state copy ("You haven't eaten yet…") fires only when the meals
 * array AND water array are both empty — if the user only drank water,
 * we still show the dashboard so the day reads as in-progress.
 */
export function FuelClient({
  state,
  displayName,
}: {
  state: FuelDayState;
  displayName: string | null;
}) {
  const reduce = useReducedMotion();
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const filledCount = state.water.reduce(
    (a, w) => a + Math.max(1, Math.round(w.oz / WATER_POUR_OZ)),
    0
  );

  const hasNothing = state.meals.length === 0 && state.water.length === 0;

  async function handleSubmit(input: MealInput) {
    return logMealAction(input);
  }

  return (
    <div className="mx-auto max-w-[720px] px-5 lg:px-8 py-6 pb-32 lg:pb-10">
      <motion.header
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="mb-6"
      >
        <p className="t-caption text-[var(--text-subtle)] uppercase tracking-wide">
          Fuel
        </p>
        <h1 className="font-serif text-[28px] sm:text-[32px] leading-tight text-[var(--text)]">
          {displayName ? `Eat to win, ${displayName}.` : "Eat to win."}
        </h1>
      </motion.header>

      {/* Macro dashboard */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
      >
        <FuelMacroDashboard targets={state.targets} totals={state.totals} />
      </motion.div>

      {/* Water tracker */}
      <motion.div
        className="mt-3"
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <FuelWaterTracker
          filledCount={filledCount}
          onPour={pourWaterAction}
          onUndo={undoWaterAction}
        />
      </motion.div>

      {/* Log a meal — primary action */}
      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wide">
          Meals today
        </h2>
        <Button onClick={() => setSheetOpen(true)} size="sm">
          <Plus size={14} strokeWidth={2} />
          Log a meal
        </Button>
      </div>

      {/* Meal list / empty state */}
      <div className="mt-3">
        {state.meals.length === 0 ? (
          hasNothing ? (
            <EmptyState onLog={() => setSheetOpen(true)} />
          ) : (
            <p className="t-caption text-[var(--text-subtle)] py-6 text-center">
              Water's in. Food's next.
            </p>
          )
        ) : (
          <ul className="space-y-2">
            {state.meals.map((m) => (
              <FuelMealRow key={m.id} meal={m} />
            ))}
          </ul>
        )}
      </div>

      <FuelLogMealSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

function EmptyState({ onLog }: { onLog: () => void }) {
  return (
    <div className="rounded-[var(--radius)] border border-dashed border-[var(--border)] px-6 py-8 text-center">
      <p className="font-serif text-[20px] text-[var(--text)] leading-snug">
        You haven't eaten yet.
      </p>
      <p className="mt-2 text-sm text-[var(--text-subtle)] max-w-[40ch] mx-auto">
        That's either discipline or a problem. Log your first meal.
      </p>
      <div className="mt-4">
        <Button onClick={onLog}>
          <Plus size={14} strokeWidth={2} />
          Log a meal
        </Button>
      </div>
    </div>
  );
}
