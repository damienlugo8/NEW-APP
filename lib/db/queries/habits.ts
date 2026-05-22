import { supabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import {
  DEFAULT_HABITS,
  ymd,
  type Habit,
  type HabitIcon,
  type HabitWithToday,
  type DayRecord,
  type ProgramEnrollment,
  type ProgramKey,
} from "@/lib/types/habit";

/**
 * Server-side reads for the DAILY tab.
 *
 * Demo mode (no Supabase env): returns the 8 default habits with
 * `completed_today=false`, an empty history, and no enrollment. Lets the
 * page render fully even before the database exists.
 */

const HISTORY_DAYS = 28;

interface HabitRow {
  id: string;
  habit_key: string;
  label: string;
  icon: string | null;
  sort_order: number;
}

interface HabitLogRow {
  habit_id: string;
  log_date: string;
}

/** Demo dataset — same eight defaults the SQL seed function inserts. */
function demoHabitsWithToday(): HabitWithToday[] {
  return DEFAULT_HABITS.map((h) => ({ ...h, completed_today: false }));
}

function demoHistory(today: string): DayRecord[] {
  const out: DayRecord[] = [];
  const d = new Date(today + "T00:00:00");
  for (let i = 0; i < HISTORY_DAYS; i++) {
    out.push({ date: ymd(d), completed: 0, total: DEFAULT_HABITS.length });
    d.setDate(d.getDate() - 1);
  }
  return out;
}

/**
 * Fetches the user's active habits + each habit's "completed today" flag in
 * one network round-trip. Seeds defaults on first read if the user has none.
 */
export async function getHabitsForToday(): Promise<{
  today: string;
  habits: HabitWithToday[];
}> {
  const today = ymd(new Date());

  if (!supabaseConfigured) return { today, habits: demoHabitsWithToday() };
  const sb = await supabaseServer();
  if (!sb) return { today, habits: demoHabitsWithToday() };

  const { data: u } = await sb.auth.getUser();
  if (!u.user) return { today, habits: demoHabitsWithToday() };

  // Read habits; if empty, seed defaults via the SQL helper.
  let { data: habitRows } = await sb
    .from("habits")
    .select("id,habit_key,label,icon,sort_order")
    .is("archived_at", null)
    .order("sort_order", { ascending: true });

  if (!habitRows || habitRows.length === 0) {
    await sb.rpc("seed_default_habits", { p_user: u.user.id });
    const { data: seeded } = await sb
      .from("habits")
      .select("id,habit_key,label,icon,sort_order")
      .is("archived_at", null)
      .order("sort_order", { ascending: true });
    habitRows = seeded ?? [];
  }

  if (!habitRows || habitRows.length === 0) {
    return { today, habits: demoHabitsWithToday() };
  }

  const { data: logs } = await sb
    .from("habit_logs")
    .select("habit_id,log_date")
    .eq("log_date", today);

  const completed = new Set((logs ?? []).map((l: HabitLogRow) => l.habit_id));

  const habits: HabitWithToday[] = (habitRows as HabitRow[]).map((h) => ({
    id: h.id,
    habit_key: h.habit_key,
    label: h.label,
    icon: (h.icon as HabitIcon | null) ?? null,
    sort_order: h.sort_order,
    completed_today: completed.has(h.id),
  }));

  return { today, habits };
}

/**
 * 28-day window of completion counts. Returned **descending** (today first)
 * so the streak calculator can walk it directly.
 */
export async function getHistory(totalHabitsToday: number): Promise<DayRecord[]> {
  const today = ymd(new Date());

  if (!supabaseConfigured) return demoHistory(today);
  const sb = await supabaseServer();
  if (!sb) return demoHistory(today);

  const { data: u } = await sb.auth.getUser();
  if (!u.user) return demoHistory(today);

  const end = new Date(today + "T00:00:00");
  const start = new Date(end);
  start.setDate(end.getDate() - (HISTORY_DAYS - 1));

  const { data } = await sb
    .from("habit_logs")
    .select("log_date")
    .gte("log_date", ymd(start))
    .lte("log_date", today);

  // Bucket by date
  const buckets = new Map<string, number>();
  for (const row of (data ?? []) as { log_date: string }[]) {
    buckets.set(row.log_date, (buckets.get(row.log_date) ?? 0) + 1);
  }

  const out: DayRecord[] = [];
  const cursor = new Date(end);
  for (let i = 0; i < HISTORY_DAYS; i++) {
    const key = ymd(cursor);
    out.push({
      date: key,
      completed: buckets.get(key) ?? 0,
      total: totalHabitsToday,
    });
    cursor.setDate(cursor.getDate() - 1);
  }
  return out;
}

/** Active program enrollment, if any. Returns null in demo mode. */
export async function getActiveEnrollment(): Promise<ProgramEnrollment | null> {
  if (!supabaseConfigured) return null;
  const sb = await supabaseServer();
  if (!sb) return null;

  const { data: u } = await sb.auth.getUser();
  if (!u.user) return null;

  const { data } = await sb
    .from("program_enrollments")
    .select("id,program_key,started_at,current_day,hard_resets,status")
    .eq("status", "active")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return {
    id: data.id,
    program_key: data.program_key as ProgramKey,
    started_at: data.started_at,
    current_day: data.current_day,
    hard_resets: data.hard_resets,
    status: data.status,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Mutations (called from server actions)
// ─────────────────────────────────────────────────────────────────────────

/** Toggles today's log for a habit. Idempotent via the (user, habit, date)
 *  unique constraint and explicit delete-on-uncheck. */
export async function toggleHabitToday(
  habitId: string,
  shouldComplete: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabaseConfigured) {
    // Demo mode: pretend it worked (client keeps optimistic state).
    return { ok: true };
  }
  const sb = await supabaseServer();
  if (!sb) return { ok: false, error: "supabase_unavailable" };

  const { data: u } = await sb.auth.getUser();
  if (!u.user) return { ok: false, error: "unauthenticated" };

  const today = ymd(new Date());

  if (shouldComplete) {
    const { error } = await sb
      .from("habit_logs")
      .upsert(
        { user_id: u.user.id, habit_id: habitId, log_date: today },
        { onConflict: "user_id,habit_id,log_date", ignoreDuplicates: true }
      );
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await sb
      .from("habit_logs")
      .delete()
      .eq("habit_id", habitId)
      .eq("log_date", today);
    if (error) return { ok: false, error: error.message };
  }
  return { ok: true };
}

/** Starts a program. If one is already active, marks it abandoned first. */
export async function startProgram(
  programKey: ProgramKey
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabaseConfigured) return { ok: true };
  const sb = await supabaseServer();
  if (!sb) return { ok: false, error: "supabase_unavailable" };

  const { data: u } = await sb.auth.getUser();
  if (!u.user) return { ok: false, error: "unauthenticated" };

  const today = ymd(new Date());

  // Abandon any active enrollment first — only one program at a time.
  await sb
    .from("program_enrollments")
    .update({ status: "abandoned", updated_at: new Date().toISOString() })
    .eq("user_id", u.user.id)
    .eq("status", "active");

  const { error } = await sb.from("program_enrollments").insert({
    user_id: u.user.id,
    program_key: programKey,
    started_at: today,
    current_day: 1,
    hard_resets: 0,
    status: "active",
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Bumps current_day on an active program based on calendar days elapsed.
 *  Called on every DAILY page load — cheap UPDATE, idempotent. */
export async function advanceEnrollmentDay(): Promise<void> {
  if (!supabaseConfigured) return;
  const sb = await supabaseServer();
  if (!sb) return;
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return;

  const { data } = await sb
    .from("program_enrollments")
    .select("id,started_at,current_day")
    .eq("user_id", u.user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!data) return;
  const started = new Date(data.started_at + "T00:00:00");
  const today = new Date(ymd(new Date()) + "T00:00:00");
  const diff = Math.floor((today.getTime() - started.getTime()) / 86_400_000) + 1;
  if (diff > data.current_day) {
    await sb
      .from("program_enrollments")
      .update({ current_day: diff, updated_at: new Date().toISOString() })
      .eq("id", data.id);
  }
}
