import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * EmptyState — designed empty cell. Three slots: an iconography panel
 * (subtle accent-tinted square, not the generic gray dustpan), a tight
 * headline + supporting line, and a CTA row.
 *
 * Used in two contexts:
 *
 *   - "card" (default): sits inside a Card, padded for in-card use.
 *   - "page": full-bleed, taller, used as the body of a feature page when
 *     the list is empty. The page variant adds an editorial italic to the
 *     headline so it lands as a moment, not a placeholder.
 */

type Props = {
  icon: LucideIcon;
  title: React.ReactNode;
  /** Optional italic accent inserted before `title` for the page variant. */
  italic?: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  /** Secondary CTA shown beneath the primary action. */
  secondary?: React.ReactNode;
  variant?: "card" | "page";
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  italic,
  description,
  action,
  secondary,
  variant = "card",
  className,
}: Props) {
  const isPage = variant === "page";
  return (
    <div
      className={cn(
        "flex flex-col items-center text-center",
        isPage
          ? "py-20 px-6 rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] bg-[color-mix(in_oklab,var(--surface)_60%,transparent)]"
          : "py-12 px-6",
        className
      )}
    >
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-[var(--radius)]",
          "bg-[var(--accent-soft)] text-[var(--accent)]",
          isPage ? "h-14 w-14 mb-6" : "h-11 w-11 mb-5"
        )}
      >
        <Icon size={isPage ? 22 : 18} strokeWidth={1.5} aria-hidden />
      </span>

      {isPage && italic ? (
        <h2 className="t-h2 text-[var(--text)] max-w-[28ch]">
          <span className="font-serif italic text-[var(--text-muted)]">{italic}</span>{" "}
          {title}
        </h2>
      ) : (
        <h3 className={cn(isPage ? "t-h2 max-w-[28ch]" : "t-h3", "text-[var(--text)]")}>
          {title}
        </h3>
      )}

      {description && (
        <p
          className={cn(
            "text-[var(--text-muted)] mt-3 max-w-[42ch]",
            isPage ? "t-body-lg" : "t-small"
          )}
        >
          {description}
        </p>
      )}

      {(action || secondary) && (
        <div className={cn("flex flex-col items-center gap-2", isPage ? "mt-8" : "mt-6")}>
          {action}
          {secondary && (
            <div className="text-xs text-[var(--text-subtle)]">{secondary}</div>
          )}
        </div>
      )}
    </div>
  );
}
