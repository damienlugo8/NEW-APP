import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export async function getUser() {
  const sb = await supabaseServer();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  return data.user;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export async function getProfile() {
  const sb = await supabaseServer();
  if (!sb) return null;
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return null;
  const { data } = await sb
    .from("profiles")
    .select("*")
    .eq("id", u.user.id)
    .maybeSingle();
  return data ?? null;
}
