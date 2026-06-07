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

/** Result shape from the Claude single-plate estimator. Blunt-mode meal_name
 *  is expected to be terse and judgmental ("Pizza. Bro."). Backs the camera
 *  path of the "Log a meal" sheet. */
export interface AnalyzedMeal {
  mealName: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  verdict: string;         // one-line FORGE response
}

// ─────────────────────────────────────────────────────────────────────────
// Fridge-scan meal builder (POST /api/fuel/analyze)
//
// The hero AI moment: snap your fridge/ingredients, get back two buildable
// high-protein meals. JSON keys are snake_case to mirror the model contract
// exactly (the prompt asks for these literal keys) — no remapping layer.
// ─────────────────────────────────────────────────────────────────────────
export interface ScannedMealMacros {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface ScannedMeal {
  name: string;
  tagline: string;
  ingredients: string[];
  steps: string[];
  macros: ScannedMealMacros;
  prep_minutes: number;
}

export interface FridgeScanResult {
  ingredients_detected: string[];
  meals: ScannedMeal[];
}

/** Daily macro targets the scan builds meals against — derived from the
 *  user's goal + bodyweight, or sane defaults when stats are missing. */
export interface ScanTargets {
  calorieTarget: number;
  proteinTarget: number;
}

export const DEFAULT_SCAN_CALORIE_TARGET = 2200;
export const DEFAULT_SCAN_PROTEIN_TARGET = 160;

export function clampPct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((part / whole) * 100)));
}
