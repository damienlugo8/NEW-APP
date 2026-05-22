import { redirect } from "next/navigation";

/**
 * Legacy notary route. After the FORGE pivot the home tab is /daily.
 * We redirect to keep existing bookmarks + the post-auth callback's
 * default `next` (kept fallback-safe by callback/route.ts) working
 * if anything still ships /dashboard URLs.
 *
 * The original notary dashboard implementation lives in git history at
 * the pre-pivot HEAD if it's ever needed.
 */
export default function LegacyDashboardRedirect() {
  redirect("/daily");
}
