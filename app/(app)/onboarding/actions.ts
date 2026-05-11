"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";

const schema = z.object({
  full_legal_name: z.string().min(2, "Enter your full legal name."),
  business_name: z.string().optional().nullable(),
  phone: z.string().min(7, "Enter a valid phone."),
  commission_state: z.string().length(2, "Use the 2-letter state code."),
  commission_expires_at: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date."),
  notary_id_number: z.string().min(1, "Enter your notary ID number."),
});

export type OnboardingState = { error?: string; fieldErrors?: Record<string, string> };

export async function completeOnboarding(
  _: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  if (!supabaseConfigured) {
    // Demo mode: skip persistence, just go to dashboard.
    redirect("/dashboard");
  }
  const sb = await supabaseServer();
  if (!sb) return { error: "Auth not configured." };
  const { data: u } = await sb.auth.getUser();
  if (!u.user) redirect("/login");

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { fieldErrors };
  }

  const { error } = await sb.from("profiles").upsert({
    id: u.user.id,
    email: u.user.email,
    ...parsed.data,
    business_name: parsed.data.business_name || null,
    onboarded_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };

  redirect("/dashboard");
}
