import { supabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";

/**
 * Earnings rollups for the dashboard hero card.
 *
 * - dailyEarningsLast30(): array of 30 daily totals (oldest → newest, cents).
 *   Powers the sparkline. Demo mode returns 30 zeros (so the sparkline shows
 *   its dashed-baseline empty state cleanly).
 *
 * - monthOverMonthDelta(): percentage change in completed-signing revenue
 *   between the current calendar month and the previous one. Used to render
 *   the +/-% chip on the hero earnings card. Null if there's no prior data.
 */

type FeeRow = { fee_cents: number | null; scheduled_at: string };

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function dailyEarningsLast30(): Promise<number[]> {
  const empty = Array.from({ length: 30 }, () => 0);
  if (!supabaseConfigured) return empty;
  const sb = await supabaseServer();
  if (!sb) return empty;

  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(end.getDate() - 29);
  start.setHours(0, 0, 0, 0);

  const { data } = await sb
    .from("appointments")
    .select("fee_cents,scheduled_at,status")
    .gte("scheduled_at", start.toISOString())
    .lte("scheduled_at", end.toISOString())
    .eq("status", "completed");

  const buckets = new Map<string, number>();
  for (const row of (data ?? []) as FeeRow[]) {
    const k = ymd(new Date(row.scheduled_at));
    buckets.set(k, (buckets.get(k) ?? 0) + (row.fee_cents ?? 0));
  }

  const out: number[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    out.push(buckets.get(ymd(d)) ?? 0);
  }
  return out;
}

/**
 * Percentage change between this month's completed-signing revenue and
 * last month's. Returns null if last month had zero revenue (no honest
 * comparison to draw).
 */
export async function monthOverMonthDelta(): Promise<{
  thisMonthCents: number;
  lastMonthCents: number;
  percent: number | null;
}> {
  if (!supabaseConfigured) {
    return { thisMonthCents: 0, lastMonthCents: 0, percent: null };
  }
  const sb = await supabaseServer();
  if (!sb) return { thisMonthCents: 0, lastMonthCents: 0, percent: null };

  const now = new Date();
  const startThis = new Date(now.getFullYear(), now.getMonth(), 1);
  const startLast = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const startNext = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const { data } = await sb
    .from("appointments")
    .select("fee_cents,scheduled_at,status")
    .gte("scheduled_at", startLast.toISOString())
    .lt("scheduled_at", startNext.toISOString())
    .eq("status", "completed");

  let thisMonthCents = 0;
  let lastMonthCents = 0;
  for (const r of (data ?? []) as FeeRow[]) {
    const t = new Date(r.scheduled_at).getTime();
    const v = r.fee_cents ?? 0;
    if (t >= startThis.getTime()) thisMonthCents += v;
    else lastMonthCents += v;
  }

  const percent =
    lastMonthCents > 0
      ? Math.round(((thisMonthCents - lastMonthCents) / lastMonthCents) * 100)
      : null;

  return { thisMonthCents, lastMonthCents, percent };
}
