"use server";

import { revalidatePath } from "next/cache";
import {
  addWaterPour,
  insertMeal,
  undoLastWaterPour,
  type MealInput,
} from "@/lib/db/queries/fuel";

/**
 * /fuel server actions. Thin wrappers; optimistic UI lives on the client.
 * Every successful mutation revalidates /fuel (and /hard-75 in the case of
 * the gallon-pour, since it can auto-complete the Hard 75 water task).
 */

export async function logMealAction(
  input: MealInput
): Promise<{ ok: boolean; error?: string }> {
  if (!input.mealName?.trim()) {
    return { ok: false, error: "Meal name is required." };
  }
  const res = await insertMeal(input);
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath("/fuel");
  return { ok: true };
}

export async function pourWaterAction(): Promise<{
  ok: boolean;
  error?: string;
}> {
  const res = await addWaterPour();
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath("/fuel");
  revalidatePath("/hard-75");
  return { ok: true };
}

export async function undoWaterAction(): Promise<{
  ok: boolean;
  error?: string;
}> {
  const res = await undoLastWaterPour();
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath("/fuel");
  return { ok: true };
}
