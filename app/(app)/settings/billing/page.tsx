import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { CancelButton } from "./cancel-button";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured, stripeConfigured } from "@/lib/env";

export const metadata = { title: "Billing" };

type Sub = {
  status?: string | null;
  plan?: string | null;
  trial_ends_at?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean | null;
};

export default async function BillingPage() {
  let sub: Sub | null = null;
  if (supabaseConfigured) {
    const sb = await supabaseServer();
    if (sb) {
      const { data: u } = await sb.auth.getUser();
      if (u.user) {
        const { data } = await sb
          .from("subscriptions")
          .select("status, plan, trial_ends_at, current_period_end, cancel_at_period_end")
          .eq("user_id", u.user.id)
          .maybeSingle();
        sub = data as Sub | null;
      }
    }
  }

  const status = sub?.status ?? "trialing";
  const plan = sub?.plan ?? "trial";

  return (
    <div className="mx-auto max-w-[820px] px-5 lg:px-8 py-10">
      <div className="mb-10">
        <p className="t-caption text-[var(--text-subtle)] mb-2">Settings</p>
        <h1 className="t-h1">Billing</h1>
        <p className="t-body text-[var(--text-muted)] mt-2">
          Manage your subscription, plan, and payment method.
        </p>
      </div>

      {!stripeConfigured && (
        <div className="mb-6 rounded-[var(--radius)] border border-dashed border-[var(--border-strong)] bg-[var(--surface-2)] p-4 text-sm text-[var(--text-muted)]">
          <span className="text-[var(--text)] font-medium">Stripe isn&apos;t connected yet.</span>{" "}
          The trial runs from your account record. Add your Stripe keys to enable real billing — the webhook handler is already in place at <code className="font-mono text-xs">app/api/stripe/webhook</code>.
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Current plan</CardTitle>
          <Badge tone={status === "active" ? "success" : status === "trialing" ? "accent" : "neutral"}>
            {status}
          </Badge>
        </CardHeader>
        <CardBody>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Plan" value={plan} />
            <Field label="Renews" value={sub?.current_period_end ?? "—"} mono />
            <Field
              label="Trial ends"
              value={sub?.trial_ends_at ?? "14 days from signup"}
              mono
            />
          </div>
          <div className="mt-6 flex items-center justify-between pt-5 border-t border-[var(--border)]">
            {sub?.cancel_at_period_end ? (
              <p className="text-sm text-[var(--text-muted)]">
                Subscription will end at the period close. You can keep using NotaryFlow until then.
              </p>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">
                You can cancel anytime — access continues through the paid period.
              </p>
            )}
            <CancelButton disabled={!supabaseConfigured || !!sub?.cancel_at_period_end} />
          </div>
        </CardBody>
      </Card>

      <div className="mt-10 flex items-center justify-between">
        <Link href="/settings" className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
          ← Back to profile
        </Link>
        <span className="font-mono text-xs text-[var(--text-subtle)]">Stripe Customer Portal — coming soon</span>
      </div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="t-caption text-[var(--text-subtle)] mb-1">{label}</p>
      <p className={"text-sm text-[var(--text)] " + (mono ? "font-mono" : "")}>{value}</p>
    </div>
  );
}
