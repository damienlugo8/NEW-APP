import { supabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import type { Appointment } from "@/lib/types/appointment";

const COLUMNS =
  "id, user_id, title, client_name, document_type, scheduled_at, duration_min, fee_cents, status, location, location_address, location_city, location_state, location_zip, notes";

/**
 * Returns every appointment for the current user.
 * Demo mode (no Supabase env) → returns [] so the UI can still render.
 */
export async function listAppointments(): Promise<Appointment[]> {
  if (!supabaseConfigured) return [];
  const sb = await supabaseServer();
  if (!sb) return [];
  const { data } = await sb
    .from("appointments")
    .select(COLUMNS)
    .order("scheduled_at", { ascending: true });
  return (data ?? []) as Appointment[];
}

export async function getAppointment(id: string): Promise<Appointment | null> {
  if (!supabaseConfigured) return null;
  const sb = await supabaseServer();
  if (!sb) return null;
  const { data } = await sb
    .from("appointments")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  return (data as Appointment | null) ?? null;
}

/**
 * Today's appointments — used by the dashboard widget.
 * `today` is in the user's local TZ; we widen by 24h on the server.
 */
export async function listTodaysAppointments(): Promise<Appointment[]> {
  if (!supabaseConfigured) return [];
  const sb = await supabaseServer();
  if (!sb) return [];
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const { data } = await sb
    .from("appointments")
    .select(COLUMNS)
    .gte("scheduled_at", start.toISOString())
    .lt("scheduled_at", end.toISOString())
    .order("scheduled_at", { ascending: true });
  return (data ?? []) as Appointment[];
}

/**
 * Lightweight summary stats for the dashboard. One query, no joins.
 */
export async function appointmentSummary(): Promise<{
  todayCount: number;
  weekCount: number;
  monthRevenueCents: number;
}> {
  if (!supabaseConfigured) return { todayCount: 0, weekCount: 0, monthRevenueCents: 0 };
  const sb = await supabaseServer();
  if (!sb) return { todayCount: 0, weekCount: 0, monthRevenueCents: 0 };

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [{ count: todayCount }, { count: weekCount }, { data: paid }] = await Promise.all([
    sb
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .gte("scheduled_at", startOfDay.toISOString())
      .lt("scheduled_at", endOfDay.toISOString()),
    sb
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .gte("scheduled_at", startOfWeek.toISOString())
      .lt("scheduled_at", endOfWeek.toISOString()),
    sb
      .from("appointments")
      .select("fee_cents,status,scheduled_at")
      .gte("scheduled_at", startOfMonth.toISOString())
      .lt("scheduled_at", endOfMonth.toISOString())
      .eq("status", "completed"),
  ]);

  const monthRevenueCents = (paid ?? []).reduce(
    (acc: number, r: { fee_cents: number | null }) => acc + (r.fee_cents ?? 0),
    0
  );
  return {
    todayCount: todayCount ?? 0,
    weekCount: weekCount ?? 0,
    monthRevenueCents,
  };
}
