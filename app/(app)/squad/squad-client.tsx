"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Trophy } from "lucide-react";
import { SquadLeaderboard } from "@/components/app/squad-leaderboard";
import { SquadGlobalBoard } from "@/components/app/squad-global-board";
import { SquadCalloutSheet } from "@/components/app/squad-callout-sheet";
import { SquadCalloutFeed } from "@/components/app/squad-callout-feed";
import { SquadRecapCard } from "@/components/app/squad-recap-card";
import { SquadEmptyState } from "@/components/app/squad-empty-state";
import {
  tierForStreak,
  type SquadMember,
  type SquadState,
} from "@/lib/types/squad";
import {
  joinSquadAction,
  calloutAction,
  respectAction,
  seenCalloutsAction,
} from "./actions";

/**
 * /squad client orchestrator.
 *
 * Null state → empty state (with join CTA). Otherwise: your standing
 * banner, incoming callouts, the 5-man roster, the weekly recap export,
 * and the global top-10. Holds the callout sheet target and wires the
 * respect / callout server actions. Marks incoming callouts as seen once,
 * on mount, so the badge clears after a beat.
 */
export function SquadClient({
  state,
  displayName,
}: {
  state: SquadState | null;
  displayName: string | null;
}) {
  const reduce = useReducedMotion();
  const [calloutTarget, setCalloutTarget] = React.useState<SquadMember | null>(
    null
  );
  const [respectBusy, setRespectBusy] = React.useState<string | null>(null);

  const hasUnseen = !!state?.callouts.some((c) => !c.seen);

  React.useEffect(() => {
    if (hasUnseen) {
      // Let the user register the badge, then mark seen.
      const t = setTimeout(() => void seenCalloutsAction(), 2500);
      return () => clearTimeout(t);
    }
  }, [hasUnseen]);

  if (!state) {
    return <SquadEmptyState onJoin={joinSquadAction} />;
  }

  const { you, members, global, callouts, squadName } = state;
  const tier = tierForStreak(you.currentStreak);

  async function handleRespect(m: SquadMember) {
    if (respectBusy) return;
    setRespectBusy(m.userId);
    await respectAction(m.userId);
    setRespectBusy(null);
  }

  async function handleSend(m: SquadMember, message: string) {
    return calloutAction(m.userId, m.handle, message);
  }

  return (
    <div className="mx-auto max-w-[720px] px-5 lg:px-8 py-6 pb-32 lg:pb-10">
      {/* Masthead */}
      <motion.header
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="mb-6"
      >
        <p className="t-caption text-[var(--text-subtle)]">
          Squad · {squadName}
        </p>
        <h1 className="font-semibold tracking-[-0.01em] text-[28px] sm:text-[32px] leading-tight text-[var(--text)] mt-1">
          {displayName ? `Hold the line, ${displayName}.` : "Hold the line."}
        </h1>

        {/* Your standing strip */}
        <div
          className="mt-4 flex items-center gap-4 rounded-[var(--radius)] border border-[var(--border)] px-5 py-4 sm:px-6"
          style={{
            background:
              "linear-gradient(90deg, var(--accent-soft) 0%, var(--surface) 60%)",
          }}
        >
          <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-[color-mix(in_oklab,var(--accent)_22%,transparent)]">
            <Trophy size={18} strokeWidth={1.75} className="text-[var(--accent)]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[var(--text)]">
              You&apos;re {you.handle} — {tier}-tier
            </p>
            <p className="t-caption t-num text-[var(--text-subtle)] mt-1">
              {you.currentStreak}-day streak · {you.respectPoints} respect
            </p>
          </div>
        </div>
      </motion.header>

      {/* Incoming callouts */}
      {callouts.length > 0 && (
        <motion.div
          className="mb-6"
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
        >
          <SquadCalloutFeed callouts={callouts} />
        </motion.div>
      )}

      {/* Roster */}
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 className="t-caption text-[var(--text-muted)] mb-3">
          Your squad
        </h2>
        <SquadLeaderboard
          members={members}
          onRespect={handleRespect}
          onCallout={(m) => setCalloutTarget(m)}
        />
      </motion.section>

      {/* Weekly recap */}
      <motion.div
        className="mt-6"
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      >
        <SquadRecapCard squadName={squadName} members={members} />
      </motion.div>

      {/* Global board */}
      <motion.section
        className="mt-8"
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 className="t-caption text-[var(--text-muted)] mb-3">
          Global top 10
        </h2>
        <SquadGlobalBoard rows={global} />
        <p className="t-caption text-[var(--text-subtle)] mt-3 text-center">
          The ceiling. Every streak in FORGE, ranked. Climb.
        </p>
      </motion.section>

      <SquadCalloutSheet
        target={calloutTarget}
        onClose={() => setCalloutTarget(null)}
        onSend={handleSend}
      />
    </div>
  );
}
