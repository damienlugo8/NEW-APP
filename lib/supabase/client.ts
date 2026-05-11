import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

export function supabaseBrowser() {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.");
  }
  return createBrowserClient(env.supabaseUrl, env.supabaseAnonKey);
}
