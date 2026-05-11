import { NextRequest, NextResponse } from "next/server";
import { env, stripeConfigured } from "@/lib/env";

/**
 * Stripe webhook receiver. STUB:
 *   - We verify the signature when STRIPE_WEBHOOK_SECRET is set.
 *   - We do NOT yet mutate `subscriptions` rows. That happens when we wire
 *     Checkout in the billing session (see PLANNING.md §4.2).
 *
 * To enable: install `stripe`, replace the stub with the real verifier and
 * switch on event.type to update the user's subscriptions row via the
 * service-role client. Keep all PII (email, full name) out of logs.
 */
export async function POST(req: NextRequest) {
  if (!stripeConfigured || !env.stripeWebhookSecret) {
    return NextResponse.json({ ok: false, reason: "stripe-not-configured" }, { status: 200 });
  }
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ ok: false, reason: "missing-signature" }, { status: 400 });

  // Real implementation will go here once `stripe` is installed:
  //
  //   const stripe = new Stripe(env.stripeSecret!);
  //   const body = await req.text();
  //   const event = stripe.webhooks.constructEvent(body, sig, env.stripeWebhookSecret!);
  //   switch (event.type) { ... }
  //
  // For now, ack-and-log so Stripe doesn't retry forever.
  return NextResponse.json({ ok: true, stub: true });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
