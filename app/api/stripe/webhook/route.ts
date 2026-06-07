import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { env, stripeConfigured } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Stripe webhook receiver — the source of truth sync for billing.
 *
 * Flow: verify the signature, map the event to a Supabase user, then write
 * plan / customer / subscription / period-end onto that user's `profiles`
 * row. The app reads subscription state from `profiles`, so this handler is
 * the only thing that mutates it.
 *
 * Contract:
 *   - 400 ONLY when signature verification fails.
 *   - 200 for every handled event, and for unrecognized types (logged warn).
 *   - Never throw out of the handler — a crash makes Stripe retry forever.
 */
export const runtime = "nodejs";

function periodEndISO(sub: Stripe.Subscription): string | null {
  // The basil API moved `current_period_end` from the subscription onto its
  // items. Read whichever is present so we work across API versions.
  const top = (sub as unknown as { current_period_end?: number }).current_period_end;
  const item = sub.items?.data?.[0]?.current_period_end;
  const unix = top ?? item;
  return unix ? new Date(unix * 1000).toISOString() : null;
}

async function setBilling(
  match: { userId?: string | null; customerId?: string | null },
  fields: Record<string, unknown>
): Promise<void> {
  let admin;
  try {
    admin = supabaseAdmin();
  } catch (err) {
    console.error("[stripe-webhook] admin client unavailable:", err);
    return;
  }

  const q = admin.from("profiles").update(fields);
  const { error } = match.userId
    ? await q.eq("id", match.userId)
    : await q.eq("stripe_customer_id", match.customerId!);

  if (error) {
    console.error("[stripe-webhook] profile update failed:", error.message);
  }
}

function planForStatus(status: Stripe.Subscription.Status): "pro" | "free" {
  // Active/trialing keep Pro; anything dunning or dead drops to free.
  if (status === "past_due" || status === "unpaid" || status === "canceled" || status === "incomplete_expired") {
    return "free";
  }
  return "pro";
}

export async function POST(req: NextRequest) {
  if (!stripeConfigured || !env.stripeWebhookSecret) {
    return NextResponse.json({ ok: false, reason: "stripe-not-configured" }, { status: 200 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ ok: false, reason: "missing-signature" }, { status: 400 });
  }

  const stripe = new Stripe(env.stripeSecret!);
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, env.stripeWebhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error("[stripe-webhook] signature verification failed:", msg);
    return NextResponse.json({ ok: false, reason: "invalid-signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId ?? session.client_reference_id ?? null;
        const customerId =
          typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;

        if (session.mode === "subscription") {
          const subId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription?.id;
          let periodEnd: string | null = null;
          if (subId) {
            const sub = await stripe.subscriptions.retrieve(subId);
            periodEnd = periodEndISO(sub);
          }
          await setBilling(
            { userId, customerId },
            {
              plan: "pro",
              stripe_customer_id: customerId,
              stripe_subscription_id: subId ?? null,
              current_period_end: periodEnd,
              updated_at: new Date().toISOString(),
            }
          );
        } else if (session.mode === "payment") {
          // One-time Lifetime purchase — no subscription to track.
          await setBilling(
            { userId, customerId },
            {
              plan: "lifetime",
              stripe_customer_id: customerId,
              updated_at: new Date().toISOString(),
            }
          );
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId ?? null;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        await setBilling(
          { userId, customerId },
          {
            plan: planForStatus(sub.status),
            stripe_subscription_id: sub.id,
            current_period_end: periodEndISO(sub),
            updated_at: new Date().toISOString(),
          }
        );
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId ?? null;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        await setBilling(
          { userId, customerId },
          {
            plan: "free",
            stripe_subscription_id: null,
            current_period_end: null,
            updated_at: new Date().toISOString(),
          }
        );
        break;
      }

      default:
        console.warn("[stripe-webhook] unhandled event type:", event.type);
    }
  } catch (err) {
    // Log but still 200 — we never want Stripe stuck retrying a poison event.
    console.error("[stripe-webhook] handler error:", err);
  }

  return NextResponse.json({ received: true });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
