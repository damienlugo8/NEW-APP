"use client";

import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GlobalRow } from "@/lib/types/squad";

/**
 * SQUAD — global top-10 leaderboard.
 *
 * The ceiling. Anonymous handles across the whole app, ranked by streak.
 * Top 3 get a subtle rank emphasis (gold/silver/bronze numerals). Your
 * row, if you crack the top 10, gets the ember tint.
 */
export function SquadGlobalBoard({ rows }: { rows: GlobalRow[] }) {
  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      {rows.map((r) => (
        <div
          key={r.rank}
          className={cn(
            "flex items-center gap-3 px-4 py-2.5 border-b border-[var(--border-soft)] last:border-b-0",
            r.isYou && "bg-[var(--accent-soft)]"
          )}
        >
          <span
            className={cn(
              "w-6 shrink-0 text-center font-mono t-num text-[13px] tabular-nums",
              rankColor(r.rank)
            )}
          >
            {r.rank}
          </span>
          <span
            className={cn(
              "flex-1 min-w-0 truncate text-sm",
              r.isYou ? "text-[var(--accent)] font-medium" : "text-[var(--text)]"
            )}
          >
            {r.handle}
            {r.isYou && (
              <span className="ml-2 text-[10px] uppercase tracking-wide text-[var(--accent)]">
                you
              </span>
            )}
          </span>
          <span className="shrink-0 flex items-center gap-1.5">
            <Flame size={13} strokeWidth={1.75} className="text-[var(--accent)]" />
            <span className="font-mono t-num text-[15px] text-[var(--text)] tabular-nums">
              {r.currentStreak}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

function rankColor(rank: number): string {
  if (rank === 1) return "text-[#F5D58A]";
  if (rank === 2) return "text-[#C9CDD2]";
  if (rank === 3) return "text-[#D4A574]";
  return "text-[var(--text-subtle)]";
}
