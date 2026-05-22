import { redirect } from "next/navigation";

/**
 * Post-pivot orphan. The underlying `appointments` table no longer exists
 * after 0003_pivot.sql; this route now lives as Hard 75. Old bookmarks
 * land on the new home.
 */
export default function AppointmentsRedirect() {
  redirect("/hard-75");
}
