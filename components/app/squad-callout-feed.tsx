"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Callout } from "@/lib/types/squad";

/**
 * SQUAD — incoming callout feed.
 *
 * One-shot messages fired at you by squadmates. No replies, no threads —
 * you read it, you answer with your streak. Unseen callouts get the ember
 * dot; everything fades to muted once acknowledged. Renders nothing when
 * the inbox is empty (the leaderboard carries the page on its own).
 */
export function SquadCalloutFeed({ callouts }: { callouts: Callout[] }) {
  const reduce = useReducedMotion();
  if (callouts.length === 0) return null;

  const unseen = callouts.filter((c) => !c.seen).length;

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="t-caption text-[var(--text-muted)]">
          Callouts
        </h2>
        {unseen > 0 && (
          <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-[var(--accent)] text-[var(--accent-fg)] text-[11px] font-semibold font-mono t-num">
            {unseen}
          </span>
        )}
      </div>

      <ul className="space-y-2">
        {callouts.map((c, i) => (
          <motion.li
            key={c.id}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "relative flex items-start gap-3 rounded-[var(--radius)] px-4 sm:px-5 py-3 border",
              c.seen
                ? "bg-[var(--surface)] border-[var(--border)]"
                : "bg-[var(--accent-soft)] border-[var(--accent)]"
            )}
          >
            <span
              className={cn(
                "shrink-0 mt-0.5 h-7 w-7 inline-flex items-center justify-center rounded-full",
                c.seen ? "bg-[var(--surface-2)]" : "bg-[color-mix(in_oklab,var(--accent)_22%,transparent)]"
              )}
            >
              <Megaphone
                size={13}
                strokeWidth={1.75}
                className={c.seen ? "text-[var(--text-subtle)]" : "text-[var(--accent)]"}
              />
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-sm text-[var(--text)] leading-snug">{c.message}</p>
              <p className="t-caption t-num text-[var(--text-subtle)] mt-1">
                from <span className="text-[var(--text-muted)]">{c.fromHandle}</span>
                {" · "}
                {relativeTime(c.createdAt)}
              </p>
            </div>

            {!c.seen && (
              <span
                className="shrink-0 mt-1.5 h-2 w-2 rounded-full bg-[var(--accent)]"
                aria-label="Unseen"
              />
            )}
          </motion.li>
        ))}
      </ul>
    </section>
  );
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  return `${d}d ago`;
}
