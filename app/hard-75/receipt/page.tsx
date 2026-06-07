import { redirect } from "next/navigation";
import { getHard75State } from "@/lib/db/queries/hard75";
import { getEnrollmentPhotos } from "@/lib/db/queries/photos";
import { getProfile } from "@/lib/auth/session";
import { supabaseConfigured } from "@/lib/env";
import {
  Day75Receipt,
  HIGHLIGHT_DAYS,
  type ReceiptHighlight,
} from "@/components/app/day-75-receipt";
import { HARD75_TASKS, type DayCompletion } from "@/lib/types/hard75";

export const metadata = { title: "Day 75 — Receipt" };
// Override the app's amber theme color for this artifact page — pure black
// chrome so screenshots on iOS look like the canvas itself.
export const viewport = { themeColor: "#000000" };

/**
 * /hard-75/receipt — the artifact page.
 *
 * Lives OUTSIDE the (app) route group on purpose: no sidebar, no top bar,
 * no bottom tabs. The page is the artifact — black canvas, gold-foil
 * DAY 75, mono receipt block. The user can print, screenshot, or share.
 *
 * Demo mode (no Supabase env) shows a fully-populated mock receipt so the
 * design renders without an account.
 */
export default async function ReceiptPage() {
  if (!supabaseConfigured) {
    // Demo receipt — populated with believable mock data
    const today = new Date();
    const startedAt = new Date(today);
    startedAt.setDate(today.getDate() - 75);
    const startStr = startedAt.toISOString().slice(0, 10);
    const endStr = today.toISOString().slice(0, 10);
    const allKeys = HARD75_TASKS.map((t) => t.key);
    const history: DayCompletion[] = Array.from({ length: 75 }, (_, i) => {
      const d = new Date(startedAt);
      d.setDate(startedAt.getDate() + i);
      return {
        date: d.toISOString().slice(0, 10),
        completed: allKeys,
        full: true,
      };
    });
    return (
      <Day75Receipt
        startedAt={startStr}
        completedAt={endStr}
        hardResets={0}
        history={history}
        displayName="Damien"
      />
    );
  }

  const state = await getHard75State();
  if (!state) redirect("/hard-75");

  // Allow viewing the receipt only once the contract is sealed.
  if (state.status !== "completed") redirect("/hard-75");

  const profile = await getProfile();
  const displayName =
    (profile?.display_name as string | null | undefined) ??
    (profile?.email ? String(profile.email).split("@")[0] : null);

  // Highlight reel — Day 1 / 37 / 75 signed URLs (null where missing).
  const photos = await getEnrollmentPhotos(state.id);
  const byDay = new Map(photos.map((p) => [p.dayNumber, p.url] as const));
  const highlights: ReceiptHighlight[] = HIGHLIGHT_DAYS.map((day) => ({
    day,
    url: byDay.get(day) ?? null,
  }));

  return (
    <Day75Receipt
      startedAt={state.startedAt}
      completedAt={state.completedAt ?? state.today}
      hardResets={state.hardResets}
      history={state.history}
      displayName={displayName}
      highlights={highlights}
    />
  );
}
