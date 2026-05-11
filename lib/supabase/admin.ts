/**
 * Service-role Supabase client. NEVER import this from a client component.
 * Lint rule + naming convention enforces server-only use.
 */
import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

export function supabaseAdmin() {
  if (!env.supabaseUrl || !env.supabaseServiceKey) {
    throw new Error("Supabase admin not configured. Set SUPABASE_SERVICE_ROLE_KEY.");
  }
  return createClient(env.supabaseUrl, env.supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
