/**
 * FORGE — habit + day-grade domain types.
 *
 * The DAILY tab's whole math lives in `gradeForCompletion()` and
 * `calculateStreak()`. Both are pure functions of completion data — kept
 * here (not in queries) so they can be reused on the client for optimistic
 * UI without round-tripping the server.
 */

export type HabitIcon =
  | "Dumbbell"
  | "BookOpen"
  | "PhoneOff"
  | "Snowflake"
  | "Ban"
  | "EyeOff"
  | "GlassWater"
  | "Mountain"
  | "Anvil"
  | "Flame";

export interface Habit {
  id: string;
  habit_key: string;
  label: string;
  icon: HabitIcon | null;
  sort_order: number;
}

/** Server returns one of these per active habit, with `completed` resolved. */
export interface HabitWithToday extends Habit {
  completed_today: boolean;
}

export interface DayRecord {
  date: string;        // 'YYYY-MM-DD'
  completed: number;
  total: number;
}

export type Grade = "S" | "A" | "B" | "C" | "D" | "F";

/**
 * The eight FORGE defaults. Mirrors the seed inside seed_default_habits()
 * — kept in sync so demo mode (no Supabase) renders the same set the
 * server would create on first DAILY visit.
 */
export const DEFAULT_HABITS: Habit[] = [
  { id: "demo-gym",             habit_key: "gym",             label: "Gym",              icon: "Dumbbell",   sort_order: 1 },
  { id: "demo-read",            habit_key: "read",            label: "Read 10 pages",    icon: "BookOpen",   sort_order: 2 },
  { id: "demo-no-scroll",       habit_key: "no_scroll",       label: "No scroll",        icon: "PhoneOff",   sort_order: 3 },
  { id: "demo-cold-shower",     habit_key: "cold_shower",     label: "Cold shower",      icon: "Snowflake",  sort_order: 4 },
  { id: "demo-no-nicotine",     habit_key: "no_nicotine",     label: "No nicotine",      icon: "Ban",        sort_order: 5 },
  { id: "demo-no-porn",         habit_key: "no_porn",         label: "No porn",          icon: "EyeOff",     sort_order: 6 },
  { id: "demo-hydrate",         habit_key: "hydrate",         label: "One gallon water", icon: "GlassWater", sort_order: 7 },
  { id: "demo-outdoor-workout", habit_key: "outdoor_workout", label: "Outdoor workout",  icon: "Mountain",   sort_order: 8 },
];

export const PROGRAMS = [
  {
    key: "hard_75",
    name: "Hard 75",
    duration_days: 75,
    tagline: "75 days. Five tasks. Miss one — start over.",
    description:
      "The wedge program. Two workouts (one outdoor), follow a diet, no alcohol, one gallon of water, read 10 pages of nonfiction, take a progress photo. Every day. For 75 days. No grace, no resets that don't reset.",
    hard_reset: true,
  },
  {
    key: "monk_mode_30",
    name: "Monk Mode 30",
    duration_days: 30,
    tagline: "30 days of deep focus.",
    description:
      "No porn, no social scroll, no junk food, daily training, read 30 minutes. A reset for your nervous system before you start anything heavier.",
    hard_reset: false,
  },
  {
    key: "forge_custom",
    name: "Forge Custom",
    duration_days: 90,
    tagline: "You write the rules. We track them.",
    description:
      "For the man who's already done a program and knows what he needs. Pick the habits, pick the duration, log every day. No template.",
    hard_reset: false,
  },
] as const;

export type ProgramKey = (typeof PROGRAMS)[number]["key"];

export interface ProgramEnrollment {
  id: string;
  program_key: ProgramKey;
  started_at: string;       // YYYY-MM-DD
  current_day: number;
  hard_resets: number;
  status: "active" | "completed" | "failed" | "abandoned";
}

// ─────────────────────────────────────────────────────────────────────────
// Pure math
// ─────────────────────────────────────────────────────────────────────────

/** YYYY-MM-DD in local time. */
export function ymd(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d + "T00:00:00") : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Letter grade from completion ratio. The cutoffs match a college-grading
 * gut model intentionally — S is the only grade that asks for everything,
 * and that's the point. Anything ≤ 59% is F.
 */
export function gradeForCompletion(completed: number, total: number): Grade {
  if (total === 0) return "F";
  const pct = (completed / total) * 100;
  if (pct >= 100) return "S";
  if (pct >= 90)  return "A";
  if (pct >= 80)  return "B";
  if (pct >= 70)  return "C";
  if (pct >= 60)  return "D";
  return "F";
}

/** Hex for the massive on-screen grade letter. Molten on S, status colors
 *  on A→F.  Red darkens as the grade falls; F is the brightest "warning"
 *  red so it actually feels like failure. */
export function gradeColor(g: Grade): string {
  switch (g) {
    case "S": return "var(--molten)";
    case "A": return "var(--success)";
    case "B": return "var(--warning)";
    case "C": return "#D97A4E";
    case "D": return "#C95B3B";
    case "F": return "var(--danger)";
  }
}

export function gradeLabel(g: Grade): string {
  switch (g) {
    case "S": return "Forged";
    case "A": return "Sharp";
    case "B": return "Solid";
    case "C": return "Showed up";
    case "D": return "Slipped";
    case "F": return "Failed";
  }
}

/**
 * Streak = consecutive days (working back from today, including today)
 * where the user logged at least one habit. Showing up beats grading well.
 * The S/A/B/C/D/F is the *quality* axis; streak is the *attendance* axis.
 *
 * Edge: if today has zero logs and yesterday has ≥1, streak counts up to
 * yesterday and we mark it "at risk" in the UI (handled by caller).
 *
 * Expects `history` sorted **descending** by date and **including today**.
 */
export function calculateStreak(history: DayRecord[], today: string): {
  count: number;
  atRisk: boolean;
} {
  if (history.length === 0) return { count: 0, atRisk: false };

  // Compute the date string for each step back from today
  const cursor = new Date(today + "T00:00:00");
  let count = 0;
  let started = false;
  let atRisk = false;

  for (let i = 0; i < history.length; i++) {
    const day = history[i];
    const targetDate = ymd(cursor);
    if (day.date !== targetDate) {
      // History has a gap — break
      break;
    }
    if (day.completed > 0) {
      count++;
      started = true;
    } else {
      // Day with zero completions
      if (!started && day.date === today) {
        // Today is empty so far. Don't count it, but allow the chain to
        // continue from yesterday — that's the "at risk" condition.
        atRisk = true;
        cursor.setDate(cursor.getDate() - 1);
        continue;
      }
      break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  return { count, atRisk };
}
