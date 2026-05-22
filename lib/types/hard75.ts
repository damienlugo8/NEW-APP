import type { LucideIcon } from "lucide-react";
import {
  Dumbbell,
  Mountain,
  Utensils,
  WineOff,
  GlassWater,
  BookOpen,
  Camera,
} from "lucide-react";

/**
 * FORGE — Hard 75 domain.
 *
 * Six tasks every day for 75 days. Miss one — hard reset. Trademark
 * sidesteps "75 Hard" by owning its own brand word; the program rules
 * are intentionally close to the public-domain protocol with one
 * meaningful FORGE difference: we count workouts as two distinct
 * tasks (indoor + outdoor) so the user logs them honestly rather than
 * grouping "two workouts" into one check.
 */

export const HARD75_DURATION = 75;
export const HARD75_TASK_COUNT = 6;

export type Hard75TaskKey =
  | "workout_indoor"
  | "workout_outdoor"
  | "diet"
  | "no_alcohol"
  | "water"
  | "read"
  | "photo";

export interface Hard75Task {
  key: Hard75TaskKey;
  label: string;
  short: string;     // mono ruler / receipt
  hint: string;
  icon: LucideIcon;
}

/**
 * The seven keys map to six daily checkboxes:
 *   - "workout_outdoor" + "workout_indoor" are two of the tasks
 *   - the legacy "single workout" key is folded into `workout_indoor`
 * Six tasks total: indoor workout, outdoor workout, diet, no alcohol,
 * one gallon water, read 10 pages, take a photo. That last one is
 * trust-based until storage ships in v1.1.
 */
export const HARD75_TASKS: readonly Hard75Task[] = [
  {
    key: "workout_indoor",
    label: "Indoor workout",
    short: "WO1",
    hint: "45 minutes. Anything you'd respect.",
    icon: Dumbbell,
  },
  {
    key: "workout_outdoor",
    label: "Outdoor workout",
    short: "WO2",
    hint: "45 minutes. Weather is part of the deal.",
    icon: Mountain,
  },
  {
    key: "diet",
    label: "Follow your diet",
    short: "DIET",
    hint: "Pick it once. No cheat meals.",
    icon: Utensils,
  },
  {
    key: "no_alcohol",
    label: "No alcohol",
    short: "DRY",
    hint: "Zero. Even one drink resets the count.",
    icon: WineOff,
  },
  {
    key: "water",
    label: "One gallon of water",
    short: "H2O",
    hint: "128 oz. Drink it across the day, not at 10pm.",
    icon: GlassWater,
  },
  {
    key: "read",
    label: "Read 10 pages",
    short: "READ",
    hint: "Nonfiction. Self-development beats fiction here.",
    icon: BookOpen,
  },
  {
    key: "photo",
    label: "Progress photo",
    short: "PIC",
    hint: "Take it. Save it. We trust you (storage in v1.1).",
    icon: Camera,
  },
] as const;

// We expose the count as 7 task slots, but the spec is six things. The
// brief lists "two workouts" as one of the five tasks, but here we count
// each workout as its own check + the photo for honest tracking. So 7
// slots, 7 required checks. Keep TASK_COUNT in sync:
export const HARD75_REQUIRED_PER_DAY = HARD75_TASKS.length;

export interface DayCompletion {
  date: string;             // YYYY-MM-DD
  completed: Hard75TaskKey[];
  full: boolean;            // all 7 keys present
}

export interface EnrollmentState {
  id: string;
  programKey: "hard_75";
  startedAt: string;        // YYYY-MM-DD
  currentDay: number;
  hardResets: number;
  status: "active" | "completed" | "failed" | "abandoned";
  completedAt: string | null;
  today: string;            // YYYY-MM-DD
  todayTasks: Set<Hard75TaskKey>;  // server-resolved
  history: DayCompletion[]; // length = currentDay, oldest first
}

export function isDayComplete(d: DayCompletion): boolean {
  return d.full;
}

export function pctComplete(currentDay: number): number {
  return Math.round((currentDay / HARD75_DURATION) * 100);
}
