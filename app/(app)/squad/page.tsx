import { getSquadState } from "@/lib/db/queries/squad";
import { getProfile } from "@/lib/auth/session";
import { SquadClient } from "./squad-client";

export const metadata = { title: "Squad" };

/**
 * /squad — anonymous 5-man accountability cells.
 *
 * Server component. Resolves the user's squad (roster, global top-10,
 * incoming callouts). Returns null state → the client renders the empty
 * state with a "Join a squad" CTA. Demo mode (no Supabase) returns a
 * populated squad so the UI renders without an account.
 */
export default async function SquadPage() {
  const [state, profile] = await Promise.all([getSquadState(), getProfile()]);

  const displayName =
    (profile?.display_name as string | null | undefined) ??
    (profile?.email ? String(profile.email).split("@")[0] : null);

  return <SquadClient state={state} displayName={displayName} />;
}
