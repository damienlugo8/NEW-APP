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
              "relative flex min-h-[64px] items-center gap-3 rounded-[var(--radius)] px-4 sm:px-5 py-3",
              "border",
              m.isYou
                ? "border-[var(--accent)]"
                : "border-[var(--border)] bg-[var(--surface)]"
            )}
            style={
              m.isYou
                ? {
                    background:
                      "linear-gradient(90deg, var(--accent-soft) 0%, var(--surface) 60%)",
                  }
                : undefined
            }
          >
            {/* Rank */}
            <span className="w-8 shrink-0 text-center font-mono t-num text-[32px] leading-none text-[var(--border-strong)]">
              {i + 1}
            </span>

            {/* Tier badge */}
            <span
              className="shrink-0 h-8 w-8 inline-flex items-center justify-center rounded-full text-[15px] font-semibold tracking-[-0.01em]"
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
                  <span className="ml-2 t-caption text-[var(--accent)]">
                    you
                  </span>
                )}
              </p>
              <p className="t-caption t-num text-[var(--text-subtle)] mt-0.5">
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
              <span className="font-mono t-num text-[17px] text-[var(--text)]">
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
                  className="h-11 w-11 sm:h-9 sm:w-9 inline-flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-subtle)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] active:scale-[0.97] transition duration-200"
                >
                  <Plus size={14} strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={() => onCallout(m)}
                  aria-label={`Call out ${m.handle}`}
                  title="Call out"
                  className="h-11 w-11 sm:h-9 sm:w-9 inline-flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-subtle)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] active:scale-[0.97] transition duration-200"
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
