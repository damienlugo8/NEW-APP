import { redirect } from "next/navigation";

/**
 * Post-pivot orphan. Notary pipeline → FORGE Squad. The Squad page now
 * lives at /squad; this redirects any stale links there.
 */
export default function PipelineRedirect() {
  redirect("/squad");
}
