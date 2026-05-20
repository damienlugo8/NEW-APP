import { cn } from "@/lib/utils";

/**
 * FORGE wordmark. Two beats:
 *   1. The mark — a single geometric anvil silhouette rendered in stroke,
 *      with one ember dot in molten. The dot is the brand: a single hot
 *      point on cold iron. Stays under 22px so it reads on mobile chrome.
 *   2. The wordmark — Geist with letter-spacing tightened to -0.04em so
 *      F-O-R-G-E reads as one machined unit, not five letters.
 *
 * Stroke color follows `currentColor` so the mark inherits text color; the
 * ember dot is hard-coded to `--molten` so it's always the one hot beat.
 */
export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
        className="shrink-0"
      >
        {/* Anvil — base, neck, horn. Geometric, not literal. */}
        <path
          d="M4 17 L20 17 L20 19 L4 19 Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M6.5 14 L17.5 14 L19 12 L5 12 Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M8 14 L8 17 M16 14 L16 17"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        {/* The ember — one hot point */}
        <circle cx="12" cy="7" r="1.4" fill="var(--molten)" />
        <circle
          cx="12"
          cy="7"
          r="2.6"
          fill="var(--molten)"
          opacity="0.18"
        />
      </svg>
      {!compact && (
        <span className="font-semibold text-[15px] tracking-[-0.04em] text-[var(--text)]">
          FORGE
        </span>
      )}
    </span>
  );
}
