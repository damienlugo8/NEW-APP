import { supabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";

export type Plan = "free" | "pro" | "lifetime";

/**
 * Returns the plan for the signed-in user, read from `profiles.plan` (the
 * Stripe webhook keeps it current). Demo mode (no Supabase keys) returns
 * "pro" so the dev sees every feature unlocked. Real users default to "free"
 * until a successful checkout upgrades them.
 */
export async function getCurrentPlan(): Promise<Plan> {
  if (!supabaseConfigured) return "pro";
  const sb = await supabaseServer();
  if (!sb) return "pro";
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return "free";
  const { data } = await sb
    .from("profiles")
    .select("plan")
    .eq("id", u.user.id)
    .maybeSingle();
  return (data?.plan as Plan | null) ?? "free";
}

export function planIsPaid(plan: Plan) {
  return plan === "pro" || plan === "lifetime";
}
