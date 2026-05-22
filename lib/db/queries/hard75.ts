import { supabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import { ymd } from "@/lib/types/habit";
import {
  HARD75_REQUIRED_PER_DAY,
  type DayCompletion,
  type EnrollmentState,
  type Hard75TaskKey,
} from "@/lib/types/hard75";

/**
 * Hard 75 — server reads + write helpers.
 *
 * Demo mode (no Supabase env): returns null enrollment so the page renders
 * the "Are you ready?" empty state. Real users hit the DB.
 */

interface EnrollmentRow {
  id: string;
  program_key: string;
  started_at: string;
  current_day: number;
  hard_resets: number;
  status: "active" | "completed" | "failed" | "abandoned";
  completed_at: string | null;
}

interface TaskLogRow {
  task_key: string;
  log_date: string;
}

/**
 * Resolves the user's active Hard 75 enrollment plus today's task list
 * plus the per-day completion history (oldest day first, length =
 * currentDay). One round-trip per query (3 total).
 */
export async function getHard75State(): Promise<EnrollmentState | null> {
  if (!supabaseConfigured) return null;
  const sb = await supabaseServer();
  if (!sb) return null;

  const { data: u } = await sb.auth.getUser();
  if (!u.user) return null;

  // Most recent Hard 75 enrollment regardless of status — so completed
  // users still get a /hard-75/receipt entry.
  const { data: row } = await sb
    .from("program_enrollments")
    .select("id,program_key,started_at,current_day,hard_resets,status,completed_at")
    .eq("user_id", u.user.id)
    .eq("program_key", "hard_75")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!row) return null;
  const e = row as EnrollmentRow;
  const today = ymd(new Date());

  // All task logs for this enrollment (small dataset, ≤ 75×7 = 525 rows).
  const { data: logRows } = await sb
    .from("program_task_logs")
    .select("task_key,log_date")
    .eq("enrollment_id", e.id);

  // Bucket logs by date
  const byDate = new Map<string, Set<Hard75TaskKey>>();
  for (const r of (logRows ?? []) as TaskLogRow[]) {
    const set = byDate.get(r.log_date) ?? new Set<Hard75TaskKey>();
    set.add(r.task_key as Hard75TaskKey);
    byDate.set(r.log_date, set);
  }

  // Build per-day history starting at started_at
  const history: DayCompletion[] = [];
  const start = new Date(e.started_at + "T00:00:00");
  for (let i = 0; i < e.current_day; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = ymd(d);
    const set = byDate.get(key) ?? new Set<Hard75TaskKey>();
    history.push({
      date: key,
      completed: [...set],
      full: set.size >= HARD75_REQUIRED_PER_DAY,
    });
  }

  const todayTasks = byDate.get(today) ?? new Set<Hard75TaskKey>();

  return {
    id: e.id,
    programKey: "hard_75",
    startedAt: e.started_at,
    currentDay: e.current_day,
    hardResets: e.hard_resets,
    status: e.status,
    completedAt: e.completed_at,
    today,
    todayTasks,
    history,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────────────────

export async function toggleHard75Task(
  enrollmentId: string,
  taskKey: Hard75TaskKey,
  shouldComplete: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabaseConfigured) return { ok: true };
  const sb = await supabaseServer();
  if (!sb) return { ok: false, error: "supabase_unavailable" };

  const { data: u } = await sb.auth.getUser();
  if (!u.user) return { ok: false, error: "unauthenticated" };

  const today = ymd(new Date());

  if (shouldComplete) {
    const { error } = await sb
      .from("program_task_logs")
      .upsert(
        {
          user_id: u.user.id,
          enrollment_id: enrollmentId,
          task_key: taskKey,
          log_date: today,
        },
        { onConflict: "enrollment_id,task_key,log_date", ignoreDuplicates: true }
      );
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await sb
      .from("program_task_logs")
      .delete()
      .eq("enrollment_id", enrollmentId)
      .eq("task_key", taskKey)
      .eq("log_date", today);
    if (error) return { ok: false, error: error.message };
  }
  return { ok: true };
}

/** Brutal honesty button. Calls the SQL function so the bump + day-reset
 *  is one transaction. */
export async function hardResetEnrollment(
  enrollmentId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabaseConfigured) return { ok: true };
  const sb = await supabaseServer();
  if (!sb) return { ok: false, error: "supabase_unavailable" };

  const { error } = await sb.rpc("hard_reset_enrollment", { p_enrollment: enrollmentId });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Server-verified completion. Throws if today's 7 aren't all logged or
 *  the user isn't on day 75 yet. */
export async function completeEnrollment(
  enrollmentId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabaseConfigured) return { ok: true };
  const sb = await supabaseServer();
  if (!sb) return { ok: false, error: "supabase_unavailable" };

  const { error } = await sb.rpc("complete_enrollment", { p_enrollment: enrollmentId });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Starts a Hard 75 enrollment specifically. Calls into the generic
 *  startProgram path. Exposed here so the empty-state CTA can call it
 *  without importing the broader habit query module. */
export async function enrollInHard75(): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabaseConfigured) return { ok: true };
  const sb = await supabaseServer();
  if (!sb) return { ok: false, error: "supabase_unavailable" };

  const { data: u } = await sb.auth.getUser();
  if (!u.user) return { ok: false, error: "unauthenticated" };
  const today = ymd(new Date());

  // Abandon any other active program first — only one program at a time.
  await sb
    .from("program_enrollments")
    .update({ status: "abandoned", updated_at: new Date().toISOString() })
    .eq("user_id", u.user.id)
    .eq("status", "active");

  const { error } = await sb.from("program_enrollments").insert({
    user_id: u.user.id,
    program_key: "hard_75",
    started_at: today,
    current_day: 1,
    hard_resets: 0,
    status: "active",
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Advances current_day if a calendar day has passed. Idempotent. */
export async function advanceHard75Day(enrollmentId: string): Promise<void> {
  if (!supabaseConfigured) return;
  const sb = await supabaseServer();
  if (!sb) return;

  const { data } = await sb
    .from("program_enrollments")
    .select("started_at,current_day,status")
    .eq("id", enrollmentId)
    .maybeSingle();

  if (!data || data.status !== "active") return;
  const start = new Date(data.started_at + "T00:00:00");
  const today = new Date(ymd(new Date()) + "T00:00:00");
  const diff = Math.floor((today.getTime() - start.getTime()) / 86_400_000) + 1;
  if (diff > data.current_day) {
    await sb
      .from("program_enrollments")
      .update({ current_day: diff, updated_at: new Date().toISOString() })
      .eq("id", enrollmentId);
  }
}
