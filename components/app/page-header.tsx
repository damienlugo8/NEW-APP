import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * PageHeader — the shared masthead pattern for every feature index page
 * (Appointments, Journal, Pipeline, Settings). Standardizes:
 *
 *   - mono caption eyebrow (so all pages have the same opening beat)
 *   - serif-adjacent title (sans, but at h1 scale w/ tight tracking)
 *   - constrained supporting line (60ch max)
 *   - right-side action slot (typically the primary "+ New …" button)
 *
 * Lives outside <Card> on purpose — page-level chrome, not card chrome.
 */

type Props = {
  eyebrow: string;
  title: React.ReactNode;
  supporting?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({ eyebrow, title, supporting, actions, className }: Props) {
  return (
    <header
      className={cn(
        "flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between mb-10",
        className
      )}
    >
      <div className="min-w-0">
        <p className="t-caption text-[var(--text-subtle)] mb-2">{eyebrow}</p>
        <h1 className="t-h1 text-[var(--text)]">{title}</h1>
        {supporting && (
          <p className="t-body text-[var(--text-muted)] mt-2.5 max-w-[60ch]">
            {supporting}
          </p>
        )}
      </div>
      {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
    </header>
  );
}
