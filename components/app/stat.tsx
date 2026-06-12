import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Stat — the dashboard's secondary metric tile. Companion to <SectionCard>.
 *
 *   - eyebrow + value (tabular nums) + helper
 *   - optional icon, optional delta chip ("+12% vs Aug" / "-3% vs Aug"),
 *     optional link wrap (whole tile becomes clickable with hover lift).
 *
 * Replaces the previous "three identical accent-soft squares" treatment by
 * letting each metric pick its own delta + helper. The earnings card on
 * the dashboard uses a different (richer) hero treatment — this is the
 * compact secondary pattern.
 */

type Delta = { value: number; label: string; positiveIsGood?: boolean };

type Props = {
  eyebrow: string;
  value: React.ReactNode;
  helper?: React.ReactNode;
  icon?: LucideIcon;
  delta?: Delta;
  href?: string;
  className?: string;
};

export function Stat({ eyebrow, value, helper, icon: Icon, delta, href, className }: Props) {
  const body = (
    <div
      className={cn(
        "group h-full rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]",
        "px-5 py-5 sm:px-6 flex flex-col gap-4 transition-colors duration-150",
        href && "hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="t-caption text-[var(--text-subtle)]">{eyebrow}</p>
        {Icon && (
          <span
            className="text-[var(--text-subtle)] group-hover:text-[var(--text-muted)] transition-colors"
            aria-hidden
          >
            <Icon size={14} strokeWidth={1.5} />
          </span>
        )}
      </div>
      <div className="flex items-end justify-between gap-3 mt-auto">
        <div className="min-w-0">
          <div className="t-num-display text-[var(--text)] truncate">{value}</div>
          {helper && (
            <p className="text-xs text-[var(--text-subtle)] mt-1.5 truncate">{helper}</p>
          )}
        </div>
        {delta && <DeltaChip delta={delta} />}
      </div>
      {href && (
        <span className="sr-only">Go to {eyebrow}</span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block rounded-[var(--radius-lg)]">
        {body}
      </Link>
    );
  }
  return body;
}

function DeltaChip({ delta }: { delta: Delta }) {
  const positiveIsGood = delta.positiveIsGood ?? true;
  const sign = delta.value === 0 ? 0 : delta.value > 0 ? 1 : -1;
  const good = sign === 0 ? null : (sign > 0) === positiveIsGood;
  const Icon = sign === 0 ? Minus : sign > 0 ? TrendingUp : TrendingDown;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[var(--radius-sm)] text-[11px] font-medium",
        good === null && "text-[var(--text-subtle)] bg-[var(--surface-2)]",
        good === true && "text-[var(--success)] bg-[color-mix(in_oklab,var(--success)_14%,transparent)]",
        good === false && "text-[var(--danger)] bg-[color-mix(in_oklab,var(--danger)_14%,transparent)]"
      )}
      aria-label={`${delta.value > 0 ? "+" : ""}${delta.value}% ${delta.label}`}
    >
      <Icon size={11} strokeWidth={1.5} aria-hidden />
      <span className="t-num">{delta.value > 0 ? "+" : ""}{delta.value}%</span>
    </span>
  );
}

/** Tiny "All →" affordance for stat cards that link out. */
export function StatLinkBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-xs text-[var(--text-subtle)]">
      {children}
      <ArrowUpRight size={11} strokeWidth={1.5} aria-hidden />
    </span>
  );
}
