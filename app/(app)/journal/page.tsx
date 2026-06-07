import { redirect } from "next/navigation";

/**
 * Legacy /journal redirects to /fuel — the FORGE replacement slot. Old
 * bookmarks survive.
 */
export default function JournalRedirect() {
  redirect("/fuel");
}
