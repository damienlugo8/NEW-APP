/**
 * FORGE — FUEL domain types.
 *
 * The FUEL tab tracks two things: macros (protein/calories) via meal logs
 * and water via 8oz pours. Targets default to the FORGE brief (180g / 2400
 * cal / 128oz) but profiles.protein_target_g / calorie_target / water_target_oz
 * override them once onboarding captures them.
 */

export const DEFAULT_PROTEIN_TARGET_G = 180;
export const DEFAULT_CALORIE_TARGET = 2400;
export const DEFAULT_WATER_TARGET_OZ = 128;

export const WATER_POUR_OZ = 8;
export const GALLON_OZ = 128;

export interface MacroTargets {
  proteinG: number;
  calories: number;
  waterOz: number;
}

export interface MealLog {
  id: string;
  loggedAt: string;        // ISO timestamptz
  mealName: string;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  notes: string | null;
  aiGenerated: boolean;
  imageUrl: string | null;
}

export interface WaterLog {
  id: string;
  oz: number;
  createdAt: string;
}

export interface FuelDayState {
  date: string;            // YYYY-MM-DD (today)
  targets: MacroTargets;
  totals: {
    proteinG: number;
    calories: number;
    waterOz: number;
  };
  meals: MealLog[];        // today, reverse-chrono (newest first)
  water: WaterLog[];       // today, chrono (oldest first) — for undo
}

/** Input payload accepted by the meal-log mutation + sheet form. */
export interface MealInput {
  mealName: string;
  calories?: number | null;
  proteinG?: number | null;
  carbsG?: number | null;
  fatG?: number | null;
  notes?: string | null;
  aiGenerated?: boolean;
  imageUrl?: string | null;
}

/** Result shape from the Claude vision analyzer. Blunt-mode meal_name is
 *  expected to be terse and judgmental ("Pizza. Bro."). */
export interface AnalyzedMeal {
  mealName: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  verdict: string;         // one-line FORGE response
}

export function clampPct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((part / whole) * 100)));
}
