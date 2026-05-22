"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Printer, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  HARD75_DURATION,
  HARD75_TASKS,
  type DayCompletion,
} from "@/lib/types/hard75";

/**
 * Day 75 Receipt — the artifact.
 *
 * This is the page the user prints, screenshots, frames. The whole point
 * of Hard 75 is to earn a thing you can hold. So the receipt has to feel
 * like an artifact, not a confirmation page.
 *
 * Design intent:
 *   - Full-bleed black canvas. No app chrome (the route renders without
 *     the app shell — see app/(app)/hard-75/receipt/page.tsx).
 *   - Bodoni Moda DAY 75 set at receipt-sized display weight (clamp 6rem→
 *     12rem). The "DAY" is italic-medium, the "75" is roman-semibold,
 *     and both are clipped to a brushed-gold linear gradient
 *     (#D4A574 → #F5D58A → #A57A3F) so the foil reads as foil.
 *   - Geist Mono receipt block beneath: started_at, completed_at, hard
 *     resets, total tasks logged. Numbers tabular, monospaced — the same
 *     "machine signed off on this" feel as a stamped certificate.
 *   - Three letterpress dividers (iron-band).
 *   - Print stylesheet preserves the black canvas (`@media print` in
 *     globals.css uses `print-color-adjust: exact`).
 *
 * Share + print actions at the top, hidden in print.
 */
export function Day75Receipt({
  startedAt,
  completedAt,
  hardResets,
  history,
  displayName,
}: {
  startedAt: string;
  completedAt: string;
  hardResets: number;
  history: DayCompletion[];
  displayName: string | null;
}) {
  const reduce = useReducedMotion();
  const totalTasksLogged = history.reduce(
    (acc, d) => acc + d.completed.length,
    0
  );
  const cleanDays = history.filter((d) => d.full).length;

  return (
    <div className="min-h-screen w-full bg-black text-white">
      {/* Actions bar */}
      <div className="print:hidden sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-white/10 px-5 py-3 flex items-center justify-between">
        <a
          href="/hard-75"
          className="text-[13px] text-white/60 hover:text-white transition-colors"
        >
          ← Back
        </a>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (typeof navigator !== "undefined" && navigator.share) {
                navigator.share({
                  title: "I just finished Hard 75.",
                  url: window.location.href,
                });
              }
            }}
            className="text-white hover:bg-white/10"
          >
            <Share2 size={14} strokeWidth={1.5} />
            Share
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.print()}
            className="text-white hover:bg-white/10"
          >
            <Printer size={14} strokeWidth={1.5} />
            Print
          </Button>
        </div>
      </div>

      <main className="mx-auto max-w-[640px] px-6 py-12 sm:py-20">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Brand mark */}
          <p
            className="text-[11px] tracking-[0.32em] uppercase text-white/50 text-center mb-2"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            FORGE · No. 001
          </p>
          <p className="text-center text-[12px] text-white/40 tracking-[0.16em] uppercase mb-12">
            Certificate of Completion
          </p>

          {/* Hairline */}
          <div
            className="h-px w-full mb-12"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(212,165,116,0.55) 50%, transparent 100%)",
            }}
          />

          {/* The hero — DAY 75 in foil */}
          <h1
            className="text-center leading-[0.95] mb-4"
            style={{
              fontFamily: "var(--font-serif-display)",
              fontSize: "clamp(6rem, 24vw, 12rem)",
              letterSpacing: "-0.04em",
              backgroundImage:
                "linear-gradient(135deg, #A57A3F 0%, #D4A574 20%, #F5D58A 45%, #FFE9B3 55%, #D4A574 75%, #8C5E2A 100%)",
              backgroundSize: "200% 200%",
              backgroundPosition: "50% 50%",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
              filter:
                "drop-shadow(0 1px 0 rgba(255,233,179,0.12)) drop-shadow(0 0 28px rgba(212,165,116,0.18))",
            }}
          >
            <em style={{ fontWeight: 500 }}>Day</em>{" "}
            <span style={{ fontWeight: 600 }}>75</span>
          </h1>

          <p
            className="text-center mb-12 italic"
            style={{
              fontFamily: "var(--font-serif-display)",
              fontSize: "clamp(1.1rem, 3.6vw, 1.5rem)",
              color: "#D4A574",
              letterSpacing: "-0.01em",
            }}
          >
            Forged.
          </p>

          {/* Recipient */}
          {displayName && (
            <>
              <div
                className="h-px w-full mb-8"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
                }}
              />
              <p className="text-center text-[12px] tracking-[0.24em] uppercase text-white/40 mb-2">
                Awarded to
              </p>
              <p
                className="text-center text-white mb-10"
                style={{
                  fontFamily: "var(--font-serif-display)",
                  fontSize: "clamp(1.4rem, 5vw, 2rem)",
                  letterSpacing: "-0.02em",
                }}
              >
                {displayName}
              </p>
            </>
          )}

          {/* Receipt block */}
          <div
            className="grid grid-cols-2 gap-x-6 gap-y-5 px-2"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <Field label="Started" value={fmtDate(startedAt)} />
            <Field label="Completed" value={fmtDate(completedAt)} />
            <Field label="Duration" value={`${HARD75_DURATION} days`} />
            <Field
              label="Clean days"
              value={`${cleanDays}/${HARD75_DURATION}`}
            />
            <Field
              label="Tasks logged"
              value={totalTasksLogged.toLocaleString()}
            />
            <Field label="Hard resets" value={String(hardResets)} />
          </div>

          {/* Tasks list — small caps, the rules you held */}
          <div
            className="h-px w-full mt-12 mb-8"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
            }}
          />
          <p className="text-center text-[12px] tracking-[0.24em] uppercase text-white/40 mb-4">
            The contract
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-white/75 text-[13px]">
            {HARD75_TASKS.map((t) => (
              <li key={t.key} className="flex items-center gap-2">
                <span
                  className="inline-block h-1 w-1 rounded-full"
                  style={{ background: "#D4A574" }}
                />
                {t.label}
              </li>
            ))}
          </ul>

          {/* Footer mark */}
          <div className="mt-16 text-center">
            <div
              className="h-px w-24 mx-auto mb-4"
              style={{ background: "rgba(212,165,116,0.55)" }}
            />
            <p
              className="text-[10px] tracking-[0.32em] uppercase text-white/35"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Forge yourself · daily
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] tracking-[0.24em] uppercase text-white/40 mb-1">
        {label}
      </p>
      <p className="text-white text-[15px] tabular-nums">{value}</p>
    </div>
  );
}

function fmtDate(ymd: string): string {
  // ymd: YYYY-MM-DD — render as e.g. "21 May 2026"
  const [y, m, d] = ymd.split("-").map((n) => parseInt(n, 10));
  if (!y || !m || !d) return ymd;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
