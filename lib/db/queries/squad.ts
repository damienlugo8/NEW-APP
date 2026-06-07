import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseConfigured } from "@/lib/env";
import { ymd } from "@/lib/types/habit";
import {
  SQUAD_SIZE,
  generateUniqueHandle,
  type Callout,
  type GlobalRow,
  type SquadMember,
  type SquadState,
} from "@/lib/types/squad";

/**
 * SQUAD — server reads + write helpers.
 *
 * Cold-start strategy: because handles are anonymous, seeded NPC members
 * are indistinguishable from real ones. joinOrCreateSquad() fills every
 * roster to 5 with forged members; as real users arrive they replace seed
 * seats. Seeding + cross-user reads (global leaderboard) use the
 * service-role admin client; user-scoped reads use the RLS client.
 */

interface MemberRow {
  user_id: string;
  anonymous_handle: string | null;
  current_streak: number | null;
  best_streak: number | null;
  respect_points: number | null;
  is_seed: boolean | null;
  last_active: string | null;
}

// ─────────────────────────────────────────────────────────────────────────
// Demo data
// ─────────────────────────────────────────────────────────────────────────
function demoState(): SquadState {
  const today = ymd(new Date());
  const raw: Array<[string, number, number, number]> = [
    // handle, current, best, respect
    ["GraniteBull", 41, 41, 35],
    ["EmberFist", 28, 33, 22],
    ["IronWolf", 19, 19, 15], // you
    ["SteelHawk", 12, 24, 18],
    ["AshViper", 4, 16, 9],
  ];
  const members: SquadMember[] = raw
    .map(([handle, cur, best, rp]) => ({
      userId: `demo-${handle}`,
      handle,
      currentStreak: cur,
      bestStreak: best,
      respectPoints: rp,
      isSeed: handle !== "IronWolf",
      isYou: handle === "IronWolf",
      lastActive: today,
    }))
    .sort((a, b) => b.currentStreak - a.currentStreak);

  const you = members.find((m) => m.isYou)!;

  const global: GlobalRow[] = [
    ["TitanDrake", 96], ["ObsidianRam", 88], ["MoltenLion", 74],
    ["CarbonBoar", 71], ["GraniteBull", 41], ["StormFalcon", 39],
    ["FlintStag", 34], ["EmberFist", 28], ["BronzeElk", 25],
    ["IronWolf", 19],
  ].map(([handle, streak], i) => ({
    rank: i + 1,
    handle: handle as string,
    currentStreak: streak as number,
    isYou: handle === "IronWolf",
  }));

  return {
    squadId: "demo-squad",
    squadName: "Forge Cell 7",
    you,
    members,
    global,
    callouts: [
      {
        id: "c1",
        fromHandle: "GraniteBull",
        toHandle: "IronWolf",
        message: "Call out IronWolf to hit S-tier this week.",
        seen: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
        incoming: true,
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Read
// ─────────────────────────────────────────────────────────────────────────

/** Returns null when the user has no squad yet (page shows empty state). */
export async function getSquadState(): Promise<SquadState | null> {
  if (!supabaseConfigured) return demoState();

  const sb = await supabaseServer();
  if (!sb) return null;
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return null;

  const admin = supabaseAdmin();
  const today = ymd(new Date());

  // Membership?
  const { data: mine } = await admin
    .from("squad_members")
    .select("squad_id")
    .eq("user_id", u.user.id)
    .maybeSingle();
  if (!mine?.squad_id) return null;

  const squadId = mine.squad_id as string;

  // Sync the user's streak from their active Hard 75 enrollment (current_day
  // = clean days). Cheap denormalization so the leaderboard reads one table.
  const { data: enrollment } = await sb
    .from("program_enrollments")
    .select("current_day,status")
    .eq("user_id", u.user.id)
    .eq("program_key", "hard_75")
    .eq("status", "active")
    .maybeSingle();
  const myStreak = enrollment?.status === "active" ? (enrollment.current_day ?? 0) : 0;

  await admin
    .from("squad_members")
    .update({ current_streak: myStreak, last_active: today })
    .eq("squad_id", squadId)
    .eq("user_id", u.user.id);

  const [squadRes, membersRes, globalRes, calloutRes] = await Promise.all([
    admin.from("squads").select("name").eq("id", squadId).maybeSingle(),
    admin
      .from("squad_members")
      .select("user_id,anonymous_handle,current_streak,best_streak,respect_points,is_seed,last_active")
      .eq("squad_id", squadId),
    admin
      .from("squad_members")
      .select("anonymous_handle,current_streak,user_id")
      .order("current_streak", { ascending: false })
      .limit(10),
    sb
      .from("callouts")
      .select("id,from_user_id,to_handle,message,seen,created_at")
      .eq("to_user_id", u.user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const memberRows = (membersRes.data ?? []) as MemberRow[];
  const members: SquadMember[] = memberRows
    .map((r) => ({
      userId: r.user_id,
      handle: r.anonymous_handle ?? "Unknown",
      currentStreak: r.current_streak ?? 0,
      bestStreak: Math.max(r.best_streak ?? 0, r.current_streak ?? 0),
      respectPoints: r.respect_points ?? 0,
      isSeed: !!r.is_seed,
      isYou: r.user_id === u.user!.id,
      lastActive: r.last_active,
    }))
    .sort((a, b) => b.currentStreak - a.currentStreak);

  const you = members.find((m) => m.isYou);
  if (!you) return null;

  const global: GlobalRow[] = (
    (globalRes.data ?? []) as Array<{
      anonymous_handle: string | null;
      current_streak: number | null;
      user_id: string;
    }>
  ).map((r, i) => ({
    rank: i + 1,
    handle: r.anonymous_handle ?? "Unknown",
    currentStreak: r.current_streak ?? 0,
    isYou: r.user_id === u.user!.id,
  }));

  // We need from-handles for incoming callouts; map from member rows when
  // possible, else fall back to a generic label.
  const handleByUser = new Map(memberRows.map((r) => [r.user_id, r.anonymous_handle ?? "A squadmate"]));
  const callouts: Callout[] = (
    (calloutRes.data ?? []) as Array<{
      id: string;
      from_user_id: string;
      to_handle: string;
      message: string;
      seen: boolean;
      created_at: string;
    }>
  ).map((r) => ({
    id: r.id,
    fromHandle: handleByUser.get(r.from_user_id) ?? "A squadmate",
    toHandle: r.to_handle,
    message: r.message,
    seen: r.seen,
    createdAt: r.created_at,
    incoming: true,
  }));

  return {
    squadId,
    squadName: (squadRes.data?.name as string) ?? "Your Squad",
    you,
    members,
    global,
    callouts,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Matchmaking + NPC seeding
// ─────────────────────────────────────────────────────────────────────────

/** Believable seed member stats — spread so the board has texture. */
function seedStats(seed: number): { cur: number; best: number; rp: number } {
  const r = (seed * 9301 + 49297) % 233280;
  const cur = Math.floor((r / 233280) * 38) + 1; // 1..38
  const best = cur + Math.floor((r % 17));
  const rp = Math.floor(cur / 7) * 5 + (r % 6);
  return { cur, best, rp };
}

let SEED_COUNTER = 1000;

/** Idempotent. Places the user in a squad with an open seat (replacing a
 *  seed) or creates a new squad seeded with 4 NPCs. */
export async function joinOrCreateSquad(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  if (!supabaseConfigured) return { ok: true };
  const sb = await supabaseServer();
  if (!sb) return { ok: false, error: "supabase_unavailable" };
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return { ok: false, error: "unauthenticated" };

  const admin = supabaseAdmin();
  const today = ymd(new Date());

  // Already a member?
  const { data: existing } = await admin
    .from("squad_members")
    .select("squad_id")
    .eq("user_id", u.user.id)
    .maybeSingle();
  if (existing?.squad_id) return { ok: true };

  // Find a squad with a seed seat to replace.
  const { data: openSeat } = await admin
    .from("squad_members")
    .select("squad_id,user_id")
    .eq("is_seed", true)
    .limit(1)
    .maybeSingle();

  if (openSeat?.squad_id) {
    const squadId = openSeat.squad_id as string;
    // Gather taken handles in that squad.
    const { data: rows } = await admin
      .from("squad_members")
      .select("anonymous_handle")
      .eq("squad_id", squadId);
    const taken = new Set(
      (rows ?? []).map((r) => (r.anonymous_handle as string) ?? "").filter(Boolean)
    );
    const handle = generateUniqueHandle(taken, Date.now() & 0xffff);

    // Remove the seed seat, insert the real member.
    await admin
      .from("squad_members")
      .delete()
      .eq("squad_id", squadId)
      .eq("user_id", openSeat.user_id);

    const { error } = await admin.from("squad_members").insert({
      squad_id: squadId,
      user_id: u.user.id,
      anonymous_handle: handle,
      current_streak: 0,
      best_streak: 0,
      respect_points: 0,
      is_seed: false,
      last_active: today,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  // No open seat — create a new squad seeded with 4 NPCs.
  const cellNum = (Date.now() % 900) + 100; // 100..999
  const { data: squad, error: squadErr } = await admin
    .from("squads")
    .insert({ name: `Forge Cell ${cellNum}`, created_by: u.user.id })
    .select("id")
    .single();
  if (squadErr || !squad) {
    return { ok: false, error: squadErr?.message ?? "squad_create_failed" };
  }
  const squadId = squad.id as string;

  const taken = new Set<string>();
  const youHandle = generateUniqueHandle(taken, Date.now() & 0xffff);
  taken.add(youHandle);

  const seedMembers = Array.from({ length: SQUAD_SIZE - 1 }, (_, i) => {
    const h = generateUniqueHandle(taken, (Date.now() & 0xffff) + i * 31 + 7);
    taken.add(h);
    const { cur, best, rp } = seedStats(SEED_COUNTER++ + i);
    return {
      squad_id: squadId,
      user_id: crypto.randomUUID(),
      anonymous_handle: h,
      current_streak: cur,
      best_streak: best,
      respect_points: rp,
      is_seed: true,
      last_active: today,
    };
  });

  const { error: insErr } = await admin.from("squad_members").insert([
    {
      squad_id: squadId,
      user_id: u.user.id,
      anonymous_handle: youHandle,
      current_streak: 0,
      best_streak: 0,
      respect_points: 0,
      is_seed: false,
      last_active: today,
    },
    ...seedMembers,
  ]);
  if (insErr) return { ok: false, error: insErr.message };

  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────────
// Callouts + respect
// ─────────────────────────────────────────────────────────────────────────

export async function sendCallout(
  toUserId: string,
  toHandle: string,
  message: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabaseConfigured) return { ok: true };
  const sb = await supabaseServer();
  if (!sb) return { ok: false, error: "supabase_unavailable" };
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return { ok: false, error: "unauthenticated" };

  // Resolve the caller's squad for the FK.
  const admin = supabaseAdmin();
  const { data: mine } = await admin
    .from("squad_members")
    .select("squad_id")
    .eq("user_id", u.user.id)
    .maybeSingle();
  if (!mine?.squad_id) return { ok: false, error: "not_in_squad" };

  const { error } = await sb.from("callouts").insert({
    squad_id: mine.squad_id,
    from_user_id: u.user.id,
    to_user_id: toUserId,
    to_handle: toHandle,
    message,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Anonymous +1. One per (from,to) per day (respect_grants unique). Also
 *  bumps the recipient's denormalized respect_points so the leaderboard
 *  reads one table. Seed recipients just get the points bump. */
export async function grantRespect(
  toUserId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabaseConfigured) return { ok: true };
  const sb = await supabaseServer();
  if (!sb) return { ok: false, error: "supabase_unavailable" };
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return { ok: false, error: "unauthenticated" };
  if (toUserId === u.user.id) return { ok: false, error: "cannot_respect_self" };

  const admin = supabaseAdmin();

  // Only write a respect_grant row when the recipient is a real user (FK).
  const { data: recipient } = await admin
    .from("squad_members")
    .select("is_seed,squad_id,respect_points")
    .eq("user_id", toUserId)
    .maybeSingle();
  if (!recipient) return { ok: false, error: "recipient_not_found" };

  if (!recipient.is_seed) {
    const today = ymd(new Date());
    const { error: grantErr } = await admin.from("respect_grants").upsert(
      {
        from_user_id: u.user.id,
        to_user_id: toUserId,
        grant_date: today,
      },
      { onConflict: "from_user_id,to_user_id,grant_date", ignoreDuplicates: true }
    );
    if (grantErr) return { ok: false, error: grantErr.message };
  }

  await admin
    .from("squad_members")
    .update({ respect_points: (recipient.respect_points ?? 0) + 1 })
    .eq("user_id", toUserId);

  return { ok: true };
}

export async function markCalloutsSeen(): Promise<void> {
  if (!supabaseConfigured) return;
  const sb = await supabaseServer();
  if (!sb) return;
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return;
  await sb
    .from("callouts")
    .update({ seen: true })
    .eq("to_user_id", u.user.id)
    .eq("seen", false);
}
