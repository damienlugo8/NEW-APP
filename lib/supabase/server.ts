import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env, supabaseConfigured } from "@/lib/env";

/**
 * Server-side Supabase client. Reads/writes the auth cookie via next/headers.
 * Returns null when env isn't configured so callers can render a graceful
 * "configure Supabase" state instead of crashing the dev server.
 */
export async function supabaseServer() {
  if (!supabaseConfigured) return null;
  const cookieStore = await cookies();
  return createServerClient(env.supabaseUrl!, env.supabaseAnonKey!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component during render — cookies can only
          // be written from Route Handlers / Server Actions. Safe to ignore.
        }
      },
    },
  });
}
