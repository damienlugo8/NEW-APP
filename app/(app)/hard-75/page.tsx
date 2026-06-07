import {
  getHard75State,
  advanceHard75Day,
} from "@/lib/db/queries/hard75";
import { getEnrollmentPhotos } from "@/lib/db/queries/photos";
import { getProfile } from "@/lib/auth/session";
import { Hard75Client } from "./hard-75-client";
import { Hard75EmptyState } from "@/components/app/hard75-empty-state";
import { enrollAction } from "./actions";

export const metadata = { title: "Hard 75" };

/**
 * /hard-75 — the wedge feature.
 *
 * Server component. Resolves the user's enrollment (any status) and either:
 *   - hands the state to the client orchestrator (active or completed), or
 *   - renders the "Are you ready?" empty state (no enrollment, demo mode,
 *     or only failed/abandoned enrollments).
 *
 * Side-effect: bumps current_day on the active enrollment if a calendar
 * day has passed since the last visit. Idempotent.
 */
export default async function Hard75Page() {
  // First pass to learn the enrollment id (if any) so we can advance the
  // calendar day before final read.
  let state = await getHard75State();
  if (state && state.status === "active") {
    await advanceHard75Day(state.id);
    state = await getHard75State();
  }

  const profile = await getProfile();
  const displayName =
    (profile?.display_name as string | null | undefined) ??
    (profile?.email ? String(profile.email).split("@")[0] : null);

  if (!state) {
    return <Hard75EmptyState onEnroll={enrollAction} />;
  }

  // If the user has a non-active enrollment that isn't completed (failed,
  // abandoned), let them sign a fresh contract.
  if (state.status === "abandoned" || state.status === "failed") {
    return <Hard75EmptyState onEnroll={enrollAction} />;
  }

  const photos = await getEnrollmentPhotos(state.id);

  return (
    <Hard75Client state={state} displayName={displayName} photos={photos} />
  );
}
