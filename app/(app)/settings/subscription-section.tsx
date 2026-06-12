"use client";

import { useState, useTransition } from "react";
import { ArrowUpRight } from "lucide-react";
import { Card } from "./profile-section";
import { Button } from "@/components/ui/button";
import { startProCheckout, openBillingPortal } from "./actions";

type Props = {
  plan: string;
  status: string;
  currentPeriodEnd?: string | null;
  stripeReady: boolean;
};

const mono = { fontFamily: "var(--font-mono)" } as const;

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function SubscriptionSection({ plan, status, currentPeriodEnd, stripeReady }: Props) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isLifetime = plan === "lifetime";
  const isFree = plan === "free";
  // Everything else (trial / solo / pro) is a managed paid plan.

  function go(action: () => Promise<{ url?: string; error?: string }>) {
    setError(null);
    start(async () => {
      const res = await action();
      if (res.url) {
        window.location.href = res.url;
        return;
      }
      setError(res.error ?? "Something went wrong.");
    });
  }

  const planLabel = isLifetime ? "Lifetime" : isFree ? "Free" : "Pro";

  return (
    <Card title="Subscription" caption="Plan">
      <div className="flex items-center justify-between gap-3 pb-5 border-b border-[var(--border-soft)]">
        <div>
          <p className="t-caption text-[var(--text-subtle)] mb-1">Current plan</p>
          <p className="text-[20px] text-[var(--text)]" style={mono}>
            {planLabel}
          </p>
        </div>
        <span className="t-caption inline-flex items-center h-6 px-2.5 rounded-full border border-[var(--border-strong)] text-[var(--text-muted)]">
          {status}
        </span>
      </div>

      <div className="pt-5">
        {isLifetime ? (
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center h-7 px-3 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] text-[12px] font-medium"
              style={mono}
            >
              Locked in for life.
            </span>
          </div>
        ) : isFree ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[var(--text-muted)]">
              Unlock the full program — 14-day free trial, cancel anytime.
            </p>
            <Button
              size="sm"
              loading={pending}
              disabled={!stripeReady}
              onClick={() => go(startProCheckout)}
            >
              Upgrade to Pro
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="t-caption text-[var(--text-subtle)] mb-1">Next billing date</p>
              <p className="text-[15px] text-[var(--text)] t-num" style={mono}>
                {fmtDate(currentPeriodEnd)}
              </p>
            </div>
            <button
              type="button"
              disabled={pending || !stripeReady}
              onClick={() => go(openBillingPortal)}
              className="inline-flex items-center gap-1 min-h-11 sm:min-h-0 text-sm text-[var(--text-muted)] hover:text-[var(--text)] underline-offset-4 hover:underline transition-colors duration-200 disabled:opacity-50 disabled:no-underline"
            >
              {pending ? "Opening…" : "Cancel subscription"}
              <ArrowUpRight size={13} strokeWidth={1.5} aria-hidden />
            </button>
          </div>
        )}

        {!stripeReady && (isFree || (!isLifetime && !isFree)) && (
          <p className="mt-3 text-xs text-[var(--text-subtle)]">
            Billing isn&apos;t connected in this environment yet.
          </p>
        )}
        {error && <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>}
      </div>
    </Card>
  );
}
