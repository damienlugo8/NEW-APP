/**
 * Drizzle client for direct Postgres access. Optional — most of the app uses
 * Supabase's PostgREST/JS client because it enforces RLS automatically.
 * Reserve this client for server-side admin operations (Stripe webhook,
 * analytics jobs) where we already trust the caller.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

let _db: ReturnType<typeof drizzle> | null = null;

export function db() {
  if (_db) return _db;
  if (!env.databaseUrl) {
    throw new Error("DATABASE_URL is not set — direct Postgres access is unavailable.");
  }
  const client = postgres(env.databaseUrl, { prepare: false });
  _db = drizzle(client, { schema });
  return _db;
}

export { schema };
