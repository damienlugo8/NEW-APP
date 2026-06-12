"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FuelMacroDashboard } from "@/components/app/fuel-macro-dashboard";
import { FuelWaterTracker } from "@/components/app/fuel-water-tracker";
import { FuelMealRow } from "@/components/app/fuel-meal-row";
import { FuelLogMealSheet } from "@/components/app/fuel-log-meal-sheet";
import { FuelFridgeScan } from "@/components/app/fuel-fridge-scan";
import {
  WATER_POUR_OZ,
  type FuelDayState,
  type MealInput,
  type ScannedMeal,
} from "@/lib/types/fuel";
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
  userId,
}: {
  state: FuelDayState;
  displayName: string | null;
  userId: string | null;
}) {
  const reduce = useReducedMotion();
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [, startTransition] = React.useTransition();

  // Optimistic macro totals: a logged meal (from the scan or the sheet) bumps
  // the bars immediately, then the server revalidate reconciles to truth.
  const [optimisticTotals, addOptimistic] = React.useOptimistic(
    state.totals,
    (cur, d: { proteinG: number; calories: number }) => ({
      ...cur,
      proteinG: cur.proteinG + d.proteinG,
      calories: cur.calories + d.calories,
    })
  );

  const filledCount = state.water.reduce(
    (a, w) => a + Math.max(1, Math.round(w.oz / WATER_POUR_OZ)),
    0
  );

  const hasNothing = state.meals.length === 0 && state.water.length === 0;

  async function handleSubmit(input: MealInput) {
    return new Promise<{ ok: boolean; error?: string }>((resolve) => {
      startTransition(async () => {
        addOptimistic({
          proteinG: input.proteinG ?? 0,
          calories: input.calories ?? 0,
        });
        resolve(await logMealAction(input));
      });
    });
  }

  // Logs a scanned meal with an optimistic macro bump, returns the result so
  // the meal card can dismiss itself only on success.
  async function handleLogScanned(meal: ScannedMeal) {
    return new Promise<{ ok: boolean; error?: string }>((resolve) => {
      startTransition(async () => {
        addOptimistic({
          proteinG: meal.macros.protein_g,
          calories: meal.macros.calories,
        });
        resolve(
          await logMealAction({
            mealName: meal.name,
            calories: meal.macros.calories,
            proteinG: meal.macros.protein_g,
            carbsG: meal.macros.carbs_g,
            fatG: meal.macros.fat_g,
            aiGenerated: true,
          })
        );
      });
    });
  }

  return (
    <div className="mx-auto max-w-[720px] px-5 lg:px-8 py-6 pb-32 lg:pb-10">
      <motion.header
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="mb-6"
      >
        <p className="t-caption text-[var(--text-subtle)]">
          Fuel
        </p>
        <h1 className="mt-1 font-semibold tracking-[-0.01em] text-[28px] sm:text-[32px] leading-tight text-[var(--text)]">
          {displayName ? `Eat to win, ${displayName}.` : "Eat to win."}
        </h1>
      </motion.header>

      {/* Macro dashboard */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
      >
        <FuelMacroDashboard targets={state.targets} totals={optimisticTotals} />
      </motion.div>

      {/* Fridge scan — the hero AI moment */}
      <motion.div
        className="mt-6"
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
      >
        <FuelFridgeScan userId={userId} onLog={handleLogScanned} />
      </motion.div>

      {/* Water tracker */}
      <motion.div
        className="mt-6"
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
        <h2 className="t-caption text-[var(--text-muted)]">
          Meals today
        </h2>
        <Button
          onClick={() => setSheetOpen(true)}
          size="sm"
          className="h-11 sm:h-9 active:scale-[0.97]"
        >
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
      <p className="font-semibold tracking-[-0.01em] text-[20px] text-[var(--text)] leading-snug">
        You haven't eaten yet.
      </p>
      <p className="mt-2 text-sm text-[var(--text-muted)] max-w-[40ch] mx-auto">
        That's either discipline or a problem. Log your first meal.
      </p>
      <div className="mt-4">
        <Button onClick={onLog} className="active:scale-[0.97]">
          <Plus size={14} strokeWidth={2} />
          Log a meal
        </Button>
      </div>
    </div>
  );
}
