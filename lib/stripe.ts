/**
 * Stripe via the REST API — no SDK dependency (mirrors the Resend approach in
 * the marketing action). Server-only. Every helper degrades gracefully when
 * Stripe isn't configured so local/preview builds never crash; callers check
 * the return value (a URL string or null) and surface a friendly state.
 */
import "server-only";
import { env } from "@/lib/env";

const API = "https://api.stripe.com/v1";

function authHeaders() {
  return {
    Authorization: `Bearer ${env.stripeSecret}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
}

/** Creates a Checkout Session for the Pro plan and returns its hosted URL. */
export async function createProCheckoutSession(opts: {
  userId: string;
  email: string;
  customerId?: string | null;
}): Promise<string | null> {
  if (!env.stripeSecret || !env.stripePricePro) return null;

  const body = new URLSearchParams();
  body.set("mode", "subscription");
  body.set("line_items[0][price]", env.stripePricePro);
  body.set("line_items[0][quantity]", "1");
  body.set("subscription_data[trial_period_days]", "14");
  body.set("client_reference_id", opts.userId);
  body.set("metadata[user_id]", opts.userId);
  body.set("success_url", `${env.appUrl}/settings?checkout=success`);
  body.set("cancel_url", `${env.appUrl}/settings?checkout=cancelled`);
  if (opts.customerId) body.set("customer", opts.customerId);
  else body.set("customer_email", opts.email);

  try {
    const res = await fetch(`${API}/checkout/sessions`, {
      method: "POST",
      headers: authHeaders(),
      body,
    });
    if (!res.ok) {
      console.error("[stripe] checkout session failed:", res.status, await res.text().catch(() => ""));
      return null;
    }
    const json = (await res.json()) as { url?: string };
    return json.url ?? null;
  } catch (err) {
    console.error("[stripe] checkout request threw:", err);
    return null;
  }
}

/** Creates a Billing Portal session so the user can manage/cancel their plan. */
export async function createBillingPortalSession(
  customerId: string
): Promise<string | null> {
  if (!env.stripeSecret || !customerId) return null;

  const body = new URLSearchParams();
  body.set("customer", customerId);
  body.set("return_url", `${env.appUrl}/settings`);

  try {
    const res = await fetch(`${API}/billing_portal/sessions`, {
      method: "POST",
      headers: authHeaders(),
      body,
    });
    if (!res.ok) {
      console.error("[stripe] portal session failed:", res.status, await res.text().catch(() => ""));
      return null;
    }
    const json = (await res.json()) as { url?: string };
    return json.url ?? null;
  } catch (err) {
    console.error("[stripe] portal request threw:", err);
    return null;
  }
}

/** Cancels a subscription immediately (used when a user deletes their account). */
export async function cancelSubscriptionNow(subscriptionId: string): Promise<boolean> {
  if (!env.stripeSecret || !subscriptionId) return false;
  try {
    const res = await fetch(`${API}/subscriptions/${subscriptionId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (!res.ok) {
      console.error("[stripe] cancel failed:", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (err) {
    console.error("[stripe] cancel request threw:", err);
    return false;
  }
}
