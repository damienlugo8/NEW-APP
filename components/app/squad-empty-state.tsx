"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * SQUAD — empty state.
 *
 * Shown when the user has no squad yet. One CTA: drop into a forged 5-man
 * cell. Because handles are anonymous, the seeded seats are indistinguishable
 * from real ones — the user never sees an empty room. Copy carries the
 * FORGE standard: "Five guys. One standard. No excuses."
 */
export function SquadEmptyState({
  onJoin,
}: {
  onJoin: () => Promise<{ ok: boolean; error?: string }>;
}) {
  const reduce = useReducedMotion();
  const [joining, setJoining] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleJoin() {
    setJoining(true);
    setError(null);
    const res = await onJoin();
    if (!res.ok) {
      setJoining(false);
      setError(res.error ?? "Couldn't drop you in. Try again.");
    }
    // On success the page revalidates and this component unmounts.
  }

  return (
    <div className="mx-auto max-w-[560px] px-5 lg:px-8 py-16">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="text-center"
      >
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-soft)] mb-6">
          <Users size={24} strokeWidth={1.5} className="text-[var(--accent)]" />
        </span>

        <h1 className="font-serif text-[32px] sm:text-[40px] leading-[1.05] text-[var(--text)]">
          Five guys.
          <br />
          One standard.
          <br />
          <span className="text-[var(--accent)]">No excuses.</span>
        </h1>

        <p className="mt-5 text-[15px] text-[var(--text-muted)] max-w-[42ch] mx-auto leading-relaxed">
          A squad is four other men chasing the same streak. Anonymous handles,
          one leaderboard. You see their numbers, they see yours. That&apos;s the
          whole point — nowhere to hide.
        </p>

        <div className="mt-7">
          <Button onClick={handleJoin} loading={joining} size="lg">
            {joining ? "Forging your cell…" : "Join a squad"}
            {!joining && <ArrowRight size={16} strokeWidth={2} />}
          </Button>
        </div>

        {error && (
          <p className="mt-4 text-[13px] text-[var(--danger,#dc2626)]">{error}</p>
        )}
      </motion.div>
    </div>
  );
}
