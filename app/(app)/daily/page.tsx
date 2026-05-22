import { DailyClient } from "./daily-client";
import {
  getHabitsForToday,
  getHistory,
  getActiveEnrollment,
  advanceEnrollmentDay,
} from "@/lib/db/queries/habits";
import { getProfile } from "@/lib/auth/session";

export const metadata = { title: "Daily" };

/**
 * /daily — FORGE's home tab.
 *
 * Server component. Fetches habits + 28-day history + active enrollment
 * in parallel, then hands the dataset to the client orchestrator. Demo
 * mode (no Supabase env) falls back to the 8 default habits with no
 * history — the page still renders fully so the first-time visual is
 * intact even before the database exists.
 *
 * No skeleton screen — Next streams the layout shell first and the
 * page paints once data resolves. The header + tabs render with the
 * outer shell, so there's no "blank app" moment.
 */
export default async function DailyPage() {
  // Side-effect: bump current_day on the active enrollment if we've
  // crossed midnight since the last visit.
  await advanceEnrollmentDay();

  const [{ today, habits }, enrollment, profile] = await Promise.all([
    getHabitsForToday(),
    getActiveEnrollment(),
    getProfile(),
  ]);
  const history = await getHistory(habits.length);

  const displayName =
    (profile?.display_name as string | null | undefined) ??
    (profile?.email ? String(profile.email).split("@")[0] : null);

  return (
    <DailyClient
      initialHabits={habits}
      initialHistory={history}
      initialEnrollment={enrollment}
      today={today}
      displayName={displayName}
    />
  );
}
