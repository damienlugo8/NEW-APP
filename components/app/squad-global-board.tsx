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
          className="flex min-h-[64px] items-center gap-3 px-4 sm:px-5 py-2.5 border-b border-[var(--border-soft)] last:border-b-0"
          style={
            r.isYou
              ? {
                  background:
                    "linear-gradient(90deg, var(--accent-soft) 0%, var(--surface) 60%)",
                }
              : undefined
          }
        >
          <span
            className={cn(
              "w-10 shrink-0 text-right font-mono t-num text-[32px] leading-none",
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
              <span className="ml-2 t-caption text-[var(--accent)]">
                you
              </span>
            )}
          </span>
          <span className="shrink-0 flex items-center gap-1.5">
            <Flame
              size={13}
              strokeWidth={1.75}
              className={r.isYou ? "text-[var(--accent)]" : "text-[var(--text-subtle)]"}
            />
            <span className="font-mono t-num text-[15px] text-[var(--text)]">
              {r.currentStreak}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Rank numerals stay deliberately dim — big mono figures that read as
 * texture, not headline. Top 3 carry a faint metallic cast (gold/silver/
 * bronze pulled down to border-strong brightness) so the podium still
 * registers without competing with handles.
 */
function rankColor(rank: number): string {
  if (rank === 1) return "text-[#8C7A4D]";
  if (rank === 2) return "text-[#6E7176]";
  if (rank === 3) return "text-[#7D6048]";
  return "text-[var(--border-strong)]";
}
