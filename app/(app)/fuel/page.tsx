import { getFuelDayState } from "@/lib/db/queries/fuel";
import { getProfile } from "@/lib/auth/session";
import { FuelClient } from "./fuel-client";

export const metadata = { title: "Fuel" };

/**
 * /fuel — macros + water.
 *
 * Server component. Resolves the day's targets, totals, meals, and water,
 * and hands it to the client orchestrator. Demo mode (no Supabase) returns
 * a populated mid-day state so the UI renders without an account.
 */
export default async function FuelPage() {
  const [state, profile] = await Promise.all([getFuelDayState(), getProfile()]);

  const displayName =
    (profile?.display_name as string | null | undefined) ??
    (profile?.email ? String(profile.email).split("@")[0] : null);

  return <FuelClient state={state} displayName={displayName} />;
}
