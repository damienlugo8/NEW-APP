"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Flame, Megaphone, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  tierColor,
  tierForStreak,
  type SquadMember,
} from "@/lib/types/squad";

/**
 * SQUAD — the 5-row roster leaderboard.
 *
 * Ranked by current streak. YOUR row gets the molten ember border so you
 * find yourself instantly. Each non-you row exposes two micro-actions:
 *   - Respect (+1) — anonymous nod
 *   - Call out — opens the callout sheet for that member
 * Tier badge (S/A/B/C/D) reads at a glance who's carrying the squad.
 */
export function SquadLeaderboard({
  members,
  onRespect,
  onCallout,
}: {
  members: SquadMember[];
  onRespect: (m: SquadMember) => void;
  onCallout: (m: SquadMember) => void;
}) {
  const reduce = useReducedMotion();

  return (
    <ul className="space-y-2">
      {members.map((m, i) => {
        const tier = tierForStreak(m.currentStreak);
        return (
          <motion.li
            key={m.userId}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "relative flex items-center gap-3 rounded-[var(--radius)] px-4 py-3",
              "bg-[var(--surface)] border",
              m.isYou
                ? "border-[var(--accent)] shadow-[0_0_0_1px_var(--accent),0_0_24px_-6px_var(--accent)]"
                : "border-[var(--border)]"
            )}
          >
            {/* Rank */}
            <span className="w-5 shrink-0 text-center font-mono t-num text-[13px] text-[var(--text-subtle)]">
              {i + 1}
            </span>

            {/* Tier badge */}
            <span
              className="shrink-0 h-8 w-8 inline-flex items-center justify-center rounded-full font-serif text-[15px] font-semibold"
              style={{
                color: tierColor(tier),
                background: "color-mix(in oklab, currentColor 14%, transparent)",
              }}
              aria-label={`Tier ${tier}`}
            >
              {tier}
            </span>

            {/* Handle + respect */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--text)] truncate">
                {m.handle}
                {m.isYou && (
                  <span className="ml-2 text-[10px] uppercase tracking-wide text-[var(--accent)]">
                    you
                  </span>
                )}
              </p>
              <p className="t-caption text-[var(--text-subtle)] mt-0.5">
                {m.respectPoints} respect
              </p>
            </div>

            {/* Streak */}
            <div className="shrink-0 flex items-center gap-1.5 mr-1">
              <Flame
                size={14}
                strokeWidth={1.75}
                className={m.currentStreak > 0 ? "text-[var(--accent)]" : "text-[var(--text-subtle)]"}
              />
              <span className="font-mono t-num text-[17px] text-[var(--text)] tabular-nums">
                {m.currentStreak}
              </span>
            </div>

            {/* Actions (not for your own row) */}
            {!m.isYou && (
              <div className="shrink-0 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onRespect(m)}
                  aria-label={`Respect ${m.handle}`}
                  title="Respect +1"
                  className="h-7 w-7 inline-flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-subtle)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] transition-colors"
                >
                  <Plus size={14} strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={() => onCallout(m)}
                  aria-label={`Call out ${m.handle}`}
                  title="Call out"
                  className="h-7 w-7 inline-flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-subtle)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition-colors"
                >
                  <Megaphone size={13} strokeWidth={1.75} />
                </button>
              </div>
            )}
          </motion.li>
        );
      })}
    </ul>
  );
}
