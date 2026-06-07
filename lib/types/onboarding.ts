/**
 * FORGE — ONBOARDING domain.
 *
 * Option sets for the rebuilt onboarding wizard. Keys here map directly to
 * the columns landed in 0003_pivot + the programs seeded in 0003/0007:
 *   - goal  -> profiles.primary_goal (enum cut/bulk/maintain/mental)
 *   - vices -> profiles.vices (text[])
 *   - program -> profiles.starter_program (FK -> programs.key)
 */

import type { LucideIcon } from "lucide-react";
import {
  Flame,
  Dumbbell,
  Scale,
  Brain,
  Smartphone,
  EyeOff,
  Cigarette,
  Wine,
  Pizza,
  BedDouble,
  MessageSquareWarning,
  Anvil,
  Moon,
  ShieldOff,
  Hammer,
} from "lucide-react";

// ── Goals (single select) ───────────────────────────────────────────────
export type GoalKey = "cut" | "bulk" | "maintain" | "mental";

export interface GoalOption {
  key: GoalKey;
  label: string;
  blurb: string;
  icon: LucideIcon;
}

export const GOALS: readonly GoalOption[] = [
  { key: "cut", label: "Cut", blurb: "Lose fat. Get lean.", icon: Flame },
  { key: "bulk", label: "Bulk", blurb: "Build muscle. Add size.", icon: Dumbbell },
  { key: "maintain", label: "Maintain", blurb: "Recomp. Hold the line.", icon: Scale },
  { key: "mental", label: "Mental discipline only", blurb: "Forge the mind first.", icon: Brain },
] as const;

// ── Vices (multi select) ─────────────────────────────────────────────────
export type ViceKey =
  | "phone_scrolling"
  | "porn"
  | "nicotine"
  | "alcohol"
  | "junk_food"
  | "oversleeping"
  | "negative_self_talk";

export interface ViceOption {
  key: ViceKey;
  label: string;
  icon: LucideIcon;
}

export const VICES: readonly ViceOption[] = [
  { key: "phone_scrolling", label: "Phone scrolling", icon: Smartphone },
  { key: "porn", label: "Porn", icon: EyeOff },
  { key: "nicotine", label: "Nicotine", icon: Cigarette },
  { key: "alcohol", label: "Alcohol", icon: Wine },
  { key: "junk_food", label: "Junk food", icon: Pizza },
  { key: "oversleeping", label: "Oversleeping", icon: BedDouble },
  { key: "negative_self_talk", label: "Negative self-talk", icon: MessageSquareWarning },
] as const;

// ── Starter programs (single select) ─────────────────────────────────────
export type ProgramKey =
  | "hard_75"
  | "monk_mode_30"
  | "strength_foundations"
  | "no_scroll_september"
  | "forge_custom";

export interface ProgramOption {
  key: ProgramKey;
  label: string;
  blurb: string;
  icon: LucideIcon;
  featured?: boolean;
}

export const PROGRAMS: readonly ProgramOption[] = [
  {
    key: "hard_75",
    label: "75 HARD",
    blurb: "The flagship. 75 days, six daily tasks, zero misses.",
    icon: Anvil,
    featured: true,
  },
  { key: "monk_mode_30", label: "Monk Mode 30", blurb: "30 days of deep focus. No porn, no scroll.", icon: Moon },
  { key: "strength_foundations", label: "Strength Foundations", blurb: "90 days. Build the barbell base.", icon: Dumbbell },
  { key: "no_scroll_september", label: "No-Scroll September", blurb: "30 days. Kill the doomscroll.", icon: ShieldOff },
  { key: "forge_custom", label: "Forge Custom", blurb: "Build your own rules. We track them.", icon: Hammer },
] as const;

// Molten ember — selected states + progress fill.
export const EMBER = "#FF6B1A";

export interface OnboardingPayload {
  first_name: string;
  age: number | null;
  height_in: number | null;
  weight_lb: number | null;
  body_fat_pct: number | null;
  goal: GoalKey | null;
  vices: ViceKey[];
  program: ProgramKey | null;
  join_squad: boolean;
}
