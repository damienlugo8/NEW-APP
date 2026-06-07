import { supabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import { ymd } from "@/lib/types/habit";
import {
  DEFAULT_CALORIE_TARGET,
  DEFAULT_PROTEIN_TARGET_G,
  DEFAULT_WATER_TARGET_OZ,
  GALLON_OZ,
  WATER_POUR_OZ,
  type FuelDayState,
  type MealInput,
  type MealLog,
  type WaterLog,
} from "@/lib/types/fuel";

export type { MealInput };

/**
 * FUEL — server reads + write helpers.
 *
 * Demo mode (no Supabase env): returns a synthetic mid-day state so the UI
 * renders without an account. Real users hit the DB.
 */

interface ProfileRow {
  protein_target_g: number | null;
  calorie_target: number | null;
  water_target_oz: number | null;
}

interface MealRow {
  id: string;
  logged_at: string;
  meal_name: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  notes: string | null;
  ai_generated: boolean | null;
  image_url: string | null;
}

interface WaterRow {
  id: string;
  oz: number;
  created_at: string;
}

/** One read returns the whole FUEL day: targets, totals, meals, water. */
export async function getFuelDayState(): Promise<FuelDayState> {
  const today = ymd(new Date());

  if (!supabaseConfigured) {
    // Demo: half-way through the day, some protein in, half a gallon down.
    const meals: MealLog[] = [
      {
        id: "demo-1",
        loggedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        mealName: "Three eggs, oats, banana",
        calories: 520,
        proteinG: 32,
        carbsG: 62,
        fatG: 16,
        notes: null,
        aiGenerated: false,
        imageUrl: null,
      },
      {
        id: "demo-2",
        loggedAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
        mealName: "Chicken, rice, broccoli",
        calories: 640,
        proteinG: 58,
        carbsG: 70,
        fatG: 12,
        notes: null,
        aiGenerated: true,
        imageUrl: null,
      },
    ];
    const water: WaterLog[] = Array.from({ length: 8 }, (_, i) => ({
      id: `w-${i}`,
      oz: WATER_POUR_OZ,
      createdAt: new Date(Date.now() - 1000 * 60 * 30 * (8 - i)).toISOString(),
    }));
    return {
      date: today,
      targets: {
        proteinG: DEFAULT_PROTEIN_TARGET_G,
        calories: DEFAULT_CALORIE_TARGET,
        waterOz: DEFAULT_WATER_TARGET_OZ,
      },
      totals: {
        proteinG: meals.reduce((a, m) => a + (m.proteinG ?? 0), 0),
        calories: meals.reduce((a, m) => a + (m.calories ?? 0), 0),
        waterOz: water.reduce((a, w) => a + w.oz, 0),
      },
      meals,
      water,
    };
  }

  const sb = await supabaseServer();
  if (!sb) return emptyState(today);

  const { data: u } = await sb.auth.getUser();
  if (!u.user) return emptyState(today);

  const startOfDay = `${today}T00:00:00`;
  const endOfDay = `${today}T23:59:59.999`;

  const [profileRes, mealsRes, waterRes] = await Promise.all([
    sb
      .from("profiles")
      .select("protein_target_g,calorie_target,water_target_oz")
      .eq("id", u.user.id)
      .maybeSingle(),
    sb
      .from("meal_logs")
      .select("id,logged_at,meal_name,calories,protein_g,carbs_g,fat_g,notes,ai_generated,image_url")
      .eq("user_id", u.user.id)
      .gte("logged_at", startOfDay)
      .lte("logged_at", endOfDay)
      .order("logged_at", { ascending: false }),
    sb
      .from("water_logs")
      .select("id,oz,created_at")
      .eq("user_id", u.user.id)
      .eq("log_date", today)
      .order("created_at", { ascending: true }),
  ]);

  const profile = (profileRes.data ?? null) as ProfileRow | null;
  const targets = {
    proteinG: profile?.protein_target_g ?? DEFAULT_PROTEIN_TARGET_G,
    calories: profile?.calorie_target ?? DEFAULT_CALORIE_TARGET,
    waterOz: profile?.water_target_oz ?? DEFAULT_WATER_TARGET_OZ,
  };

  const meals: MealLog[] = ((mealsRes.data ?? []) as MealRow[]).map((r) => ({
    id: r.id,
    loggedAt: r.logged_at,
    mealName: r.meal_name,
    calories: r.calories,
    proteinG: r.protein_g,
    carbsG: r.carbs_g,
    fatG: r.fat_g,
    notes: r.notes,
    aiGenerated: !!r.ai_generated,
    imageUrl: r.image_url,
  }));

  const water: WaterLog[] = ((waterRes.data ?? []) as WaterRow[]).map((r) => ({
    id: r.id,
    oz: r.oz,
    createdAt: r.created_at,
  }));

  return {
    date: today,
    targets,
    totals: {
      proteinG: meals.reduce((a, m) => a + (m.proteinG ?? 0), 0),
      calories: meals.reduce((a, m) => a + (m.calories ?? 0), 0),
      waterOz: water.reduce((a, w) => a + w.oz, 0),
    },
    meals,
    water,
  };
}

function emptyState(today: string): FuelDayState {
  return {
    date: today,
    targets: {
      proteinG: DEFAULT_PROTEIN_TARGET_G,
      calories: DEFAULT_CALORIE_TARGET,
      waterOz: DEFAULT_WATER_TARGET_OZ,
    },
    totals: { proteinG: 0, calories: 0, waterOz: 0 },
    meals: [],
    water: [],
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────────────────

export async function insertMeal(
  m: MealInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabaseConfigured) return { ok: true };
  const sb = await supabaseServer();
  if (!sb) return { ok: false, error: "supabase_unavailable" };
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return { ok: false, error: "unauthenticated" };

  const { error } = await sb.from("meal_logs").insert({
    user_id: u.user.id,
    meal_name: m.mealName,
    calories: m.calories ?? null,
    protein_g: m.proteinG ?? null,
    carbs_g: m.carbsG ?? null,
    fat_g: m.fatG ?? null,
    notes: m.notes ?? null,
    ai_generated: !!m.aiGenerated,
    image_url: m.imageUrl ?? null,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Adds one 8oz pour for today. If this pour pushes the running total to
 *  >= 128oz and the user has an active Hard 75 enrollment, also auto-logs
 *  the Hard 75 `water` task. Idempotent on the Hard 75 side (upsert with
 *  ignoreDuplicates). */
export async function addWaterPour(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  if (!supabaseConfigured) return { ok: true };
  const sb = await supabaseServer();
  if (!sb) return { ok: false, error: "supabase_unavailable" };
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return { ok: false, error: "unauthenticated" };

  const today = ymd(new Date());

  const { error } = await sb.from("water_logs").insert({
    user_id: u.user.id,
    log_date: today,
    oz: WATER_POUR_OZ,
  });
  if (error) return { ok: false, error: error.message };

  // Check whether this pour crossed the gallon line.
  const { data: rows } = await sb
    .from("water_logs")
    .select("oz")
    .eq("user_id", u.user.id)
    .eq("log_date", today);
  const total = (rows ?? []).reduce((a, r) => a + (r.oz ?? 0), 0);

  if (total >= GALLON_OZ) {
    // Auto-complete Hard 75 water task if there's an active enrollment.
    const { data: enrollment } = await sb
      .from("program_enrollments")
      .select("id")
      .eq("user_id", u.user.id)
      .eq("program_key", "hard_75")
      .eq("status", "active")
      .maybeSingle();
    if (enrollment?.id) {
      await sb.from("program_task_logs").upsert(
        {
          user_id: u.user.id,
          enrollment_id: enrollment.id,
          task_key: "water",
          log_date: today,
        },
        { onConflict: "enrollment_id,task_key,log_date", ignoreDuplicates: true }
      );
    }
  }

  return { ok: true };
}

export async function undoLastWaterPour(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  if (!supabaseConfigured) return { ok: true };
  const sb = await supabaseServer();
  if (!sb) return { ok: false, error: "supabase_unavailable" };
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return { ok: false, error: "unauthenticated" };

  const today = ymd(new Date());
  const { data: last } = await sb
    .from("water_logs")
    .select("id")
    .eq("user_id", u.user.id)
    .eq("log_date", today)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!last?.id) return { ok: true };
  const { error } = await sb.from("water_logs").delete().eq("id", last.id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// Meal logs are append-only by design (see 0003 RLS). No deleteMeal — if
// the user mis-logs, they log a correction (or wait for the next day).
