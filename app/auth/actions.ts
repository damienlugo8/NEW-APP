"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured, env } from "@/lib/env";

const NOT_CONFIGURED =
  "Authentication is not configured yet. Add your Supabase keys to .env.local — see README.md.";

export type AuthState = { error?: string; ok?: boolean };

export async function signUpAction(_: AuthState, formData: FormData): Promise<AuthState> {
  if (!supabaseConfigured) return { error: NOT_CONFIGURED };
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || password.length < 10) {
    return { error: "Use an email and a password of at least 10 characters." };
  }
  const sb = await supabaseServer();
  if (!sb) return { error: NOT_CONFIGURED };
  const { error } = await sb.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${env.appUrl}/auth/callback?next=/onboarding` },
  });
  if (error) return { error: error.message };
  return { ok: true };
}

export async function loginAction(_: AuthState, formData: FormData): Promise<AuthState> {
  if (!supabaseConfigured) return { error: NOT_CONFIGURED };
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const sb = await supabaseServer();
  if (!sb) return { error: NOT_CONFIGURED };
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return { error: "Email or password is incorrect." };
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function forgotPasswordAction(_: AuthState, formData: FormData): Promise<AuthState> {
  if (!supabaseConfigured) return { error: NOT_CONFIGURED };
  const email = String(formData.get("email") ?? "").trim();
  const sb = await supabaseServer();
  if (!sb) return { error: NOT_CONFIGURED };
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: `${env.appUrl}/auth/callback?next=/reset-password`,
  });
  // Always succeed-shaped to avoid email enumeration.
  if (error && !/rate/i.test(error.message)) return { ok: true };
  return { ok: true };
}

export async function resetPasswordAction(_: AuthState, formData: FormData): Promise<AuthState> {
  if (!supabaseConfigured) return { error: NOT_CONFIGURED };
  const password = String(formData.get("password") ?? "");
  if (password.length < 10) return { error: "Password must be at least 10 characters." };
  const sb = await supabaseServer();
  if (!sb) return { error: NOT_CONFIGURED };
  const { error } = await sb.auth.updateUser({ password });
  if (error) return { error: error.message };
  redirect("/login");
}

export async function signOutAction() {
  const sb = await supabaseServer();
  if (sb) await sb.auth.signOut();
  redirect("/");
}
