import { redirect } from "next/navigation";

/**
 * Post-pivot orphan. Notary pipeline → FORGE Squad. Squad page comes in
 * a later session; until then this redirects to /daily so users don't
 * land on a broken table query.
 */
export default function PipelineRedirect() {
  redirect("/daily");
}
