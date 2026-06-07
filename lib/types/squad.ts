/**
 * FORGE — SQUAD domain types + anonymous handle generator.
 *
 * Handles are two-word combos: a hard material/element adjective + a
 * predatory/forceful noun. IronWolf, SteelHawk, EmberFist. The generator
 * is deterministic-friendly (seedable) so seeded NPCs and real users draw
 * from the same pool — that's what makes them indistinguishable, which is
 * the entire point of anonymous accountability.
 */

export const SQUAD_SIZE = 5;
export const RESPECT_PER_MILESTONE = 5; // every 7-day streak milestone
export const MILESTONE_DAYS = 7;

const ADJECTIVES = [
  "Iron", "Steel", "Ember", "Granite", "Onyx", "Cobalt", "Ash", "Forge",
  "Stone", "Frost", "Coal", "Brass", "Flint", "Obsidian", "Titan", "Carbon",
  "Storm", "Iron", "Molten", "Slate", "Bronze", "Quartz", "Basalt", "Anvil",
] as const;

const NOUNS = [
  "Wolf", "Hawk", "Fist", "Bear", "Ram", "Bull", "Boar", "Falcon",
  "Drake", "Lion", "Viper", "Stag", "Raven", "Jackal", "Mantis", "Hound",
  "Tiger", "Cobra", "Shark", "Panther", "Bison", "Elk", "Wolverine", "Badger",
] as const;

export type SquadTier = "S" | "A" | "B" | "C" | "D";

export interface SquadMember {
  userId: string;
  handle: string;
  currentStreak: number;
  bestStreak: number;
  respectPoints: number;
  isSeed: boolean;
  isYou: boolean;
  lastActive: string | null;
}

export interface GlobalRow {
  rank: number;
  handle: string;
  currentStreak: number;
  isYou: boolean;
}

export interface Callout {
  id: string;
  fromHandle: string;
  toHandle: string;
  message: string;
  seen: boolean;
  createdAt: string;
  incoming: boolean; // true if directed AT the current user
}

export interface SquadState {
  squadId: string;
  squadName: string;
  you: SquadMember;
  members: SquadMember[];   // all 5, ranked by currentStreak desc
  global: GlobalRow[];      // top 10
  callouts: Callout[];      // incoming, unseen first
}

/**
 * Tier from current streak. Calibrated so S-tier is genuinely hard:
 *   S ≥ 30, A ≥ 14, B ≥ 7, C ≥ 3, D otherwise.
 */
export function tierForStreak(streak: number): SquadTier {
  if (streak >= 30) return "S";
  if (streak >= 14) return "A";
  if (streak >= 7) return "B";
  if (streak >= 3) return "C";
  return "D";
}

export function tierColor(tier: SquadTier): string {
  switch (tier) {
    case "S": return "var(--accent)";
    case "A": return "#D4A574";
    case "B": return "var(--text)";
    case "C": return "var(--text-muted)";
    case "D": return "var(--text-subtle)";
  }
}

/** Mulberry32 — tiny seeded PRNG so seeded squads are reproducible. */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Generate a handle. With a seed, deterministic; without, random. */
export function generateHandle(seed?: number): string {
  const rng = seed === undefined ? Math.random : mulberry32(seed);
  const adj = ADJECTIVES[Math.floor(rng() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(rng() * NOUNS.length)];
  return `${adj}${noun}`;
}

/** Generate a unique handle not already in `taken`. */
export function generateUniqueHandle(taken: Set<string>, seed?: number): string {
  let attempt = 0;
  let base = seed;
  // try clean combos first
  for (; attempt < 200; attempt++) {
    const h = generateHandle(base === undefined ? undefined : base + attempt);
    if (!taken.has(h)) return h;
  }
  // fall back to a numeric suffix
  let n = 2;
  while (taken.has(`${generateHandle(seed)}${n}`)) n++;
  return `${generateHandle(seed)}${n}`;
}
