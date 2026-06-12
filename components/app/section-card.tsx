import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * SectionCard — the dashboard's structural primitive. Replaces ad-hoc
 * `<section className="rounded-[var(--radius-lg)] border ...">` divs that
 * drifted from page to page.
 *
 * Two tones:
 *   - default: flat surface with hairline border
 *   - hero:    brand-wash background (radial accent tint), no border, deeper
 *              shadow. Reserved for the *one* most important card on a page
 *              — typically the "Today" card on the dashboard.
 *
 * Header is intentional: eyebrow mono caption + serif-adjacent title +
 * optional "All →" link in the corner. Body is a slot.
 */

type Props = {
  eyebrow?: string;
  title?: React.ReactNode;
  /** Optional right-side link rendered as a small ghost button. */
  link?: { href: string; label: string };
  tone?: "default" | "hero";
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Skip header padding — use when the body has its own internal padding scheme. */
  bare?: boolean;
};

export function SectionCard({
  eyebrow,
  title,
  link,
  tone = "default",
  children,
  className,
  bodyClassName,
  bare = false,
}: Props) {
  const hero = tone === "hero";
  return (
    <section
      className={cn(
        "rounded-[var(--radius-lg)] overflow-hidden",
        hero
          ? "brand-wash border border-[var(--border-soft)] shadow-[var(--shadow-md)]"
          : "bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-sm)]",
        className
      )}
    >
      {(eyebrow || title || link) && !bare && (
        <header className="px-5 sm:px-6 pt-5 pb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            {eyebrow && (
              <p className="t-caption text-[var(--text-subtle)] mb-1.5">{eyebrow}</p>
            )}
            {title && <h2 className="t-h3 text-[var(--text)] leading-tight">{title}</h2>}
          </div>
          {link && (
            <Link
              href={link.href}
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium",
                "text-[var(--text-muted)] hover:text-[var(--text)] transition-colors",
                "rounded-[var(--radius-sm)] px-2 py-1 -mr-2 min-h-11 sm:min-h-0"
              )}
            >
              {link.label}
              <ArrowUpRight size={13} strokeWidth={1.5} aria-hidden />
            </Link>
          )}
        </header>
      )}
      <div className={cn(!bare && "px-0 pb-0", bodyClassName)}>{children}</div>
    </section>
  );
}
