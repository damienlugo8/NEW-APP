import { supabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";

export type Plan = "free" | "trial" | "solo" | "pro";

/**
 * Returns the plan for the signed-in user. Demo mode (no Supabase keys)
 * returns "pro" so the dev gets to see every feature unlocked. In production
 * we default to "trial" if no subscription row exists yet.
 */
export async function getCurrentPlan(): Promise<Plan> {
  if (!supabaseConfigured) return "pro";
  const sb = await supabaseServer();
  if (!sb) return "pro";
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return "trial";
  const { data } = await sb
    .from("subscriptions")
    .select("plan")
    .eq("user_id", u.user.id)
    .maybeSingle();
  return (data?.plan as Plan | null) ?? "trial";
}

export function planHasPipeline(plan: Plan) {
  // Pipeline is the Pro differentiator. Trial users get a taste during the
  // 14-day trial; Solo plan does not.
  return plan === "pro" || plan === "trial";
}
