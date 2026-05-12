"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Wraps a feature in a frosted overlay when the user's plan doesn't include
 * it. The underlying UI still renders (so the user can see what they'd get)
 * but it's blurred and not interactive.
 */
export function ProGate({
  active,
  feature,
  reason,
  children,
}: {
  active: boolean;
  feature: string;
  reason: string;
  children: React.ReactNode;
}) {
  if (!active) return <>{children}</>;
  return (
    <div className="relative">
      {/* Blurred preview — pointer events disabled so it can't be touched. */}
      <div
        aria-hidden
        className="pointer-events-none select-none blur-[3px] opacity-70"
      >
        {children}
      </div>

      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="absolute inset-0 z-10 flex items-start justify-center pt-24 px-5"
      >
        <div className="max-w-[440px] w-full rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-md)] p-6 text-center">
          <div className="mx-auto h-10 w-10 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] inline-flex items-center justify-center">
            <Sparkles size={16} strokeWidth={1.75} />
          </div>
          <p className="t-caption text-[var(--text-subtle)] mt-4 mb-2 inline-flex items-center gap-1.5">
            <Lock size={11} strokeWidth={2} /> Pro feature
          </p>
          <h3 className="t-h3">{feature}</h3>
          <p className="text-sm text-[var(--text-muted)] mt-2 max-w-[36ch] mx-auto">
            {reason}
          </p>
          <div className="mt-5 flex items-center justify-center gap-2">
            <Link href="/settings/billing">
              <Button size="sm">Upgrade to Pro</Button>
            </Link>
            <Link href="/dashboard">
              <Button size="sm" variant="ghost">
                Maybe later
              </Button>
            </Link>
          </div>
          <p className="text-[11px] text-[var(--text-subtle)] mt-4">
            $39/mo. Cancel any time, two taps, no email.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
