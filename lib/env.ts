/**
 * Centralized env access with safe defaults so the app builds without
 * credentials. When a key is missing we return undefined and the call site
 * decides how to degrade (show "Configure Supabase" instead of crashing).
 */

function pick(key: string): string | undefined {
  const v = process.env[key];
  return v && v.length > 0 ? v : undefined;
}

export const env = {
  supabaseUrl: pick("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: pick("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceKey: pick("SUPABASE_SERVICE_ROLE_KEY"),

  databaseUrl: pick("DATABASE_URL"),

  stripeSecret: pick("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: pick("STRIPE_WEBHOOK_SECRET"),
  stripePriceSolo: pick("STRIPE_PRICE_SOLO"),
  stripePricePro: pick("STRIPE_PRICE_PRO"),

  resendKey: pick("RESEND_API_KEY"),

  appUrl: pick("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000",
} as const;

export const supabaseConfigured = !!(env.supabaseUrl && env.supabaseAnonKey);
export const stripeConfigured = !!env.stripeSecret;
