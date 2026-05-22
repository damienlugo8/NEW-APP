import { redirect } from "next/navigation";

/**
 * Post-pivot orphan. The legacy `journal_entries` table is gone (0003).
 * The slot is now FUEL — but FUEL's own page hasn't been built yet, so
 * we send users back to /daily until then.
 */
export default function JournalRedirect() {
  redirect("/daily");
}
