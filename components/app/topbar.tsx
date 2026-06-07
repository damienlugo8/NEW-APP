"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/auth/actions";
import { LogOut, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * TopBar — minimal app chrome strip. Two jobs:
 *
 *   1. Tell you where you are. On mobile (where the sidebar is hidden), the
 *      current-section title is the only way to confirm which page you're on
 *      after tapping a bottom-nav icon. Desktop shows it too as a quiet
 *      breadcrumb.
 *
 *   2. Give you an exit. The email used to sit in raw mono — replaced with
 *      a small avatar disc + dropdown affordance. Click reveals theme toggle
 *      and sign-out. Email shown as helper text inside the menu, not in the
 *      header (it's never the most useful thing on screen).
 */

// FORGE section labels. Routes still point to the old slugs until the
// per-tab pages are rebuilt; only what the user reads changes here.
const SECTION_TITLES: Array<{ match: RegExp; title: string }> = [
  { match: /^\/daily/,        title: "Daily" },
  { match: /^\/dashboard/,    title: "Daily" },
  { match: /^\/hard-75/,      title: "Hard 75" },
  { match: /^\/appointments/, title: "Hard 75" },
  { match: /^\/fuel/,         title: "Fuel" },
  { match: /^\/journal/,      title: "Fuel" },
  { match: /^\/pipeline/,     title: "Squad" },
  { match: /^\/block/,        title: "Block" },
  { match: /^\/settings/,     title: "Settings" },
  { match: /^\/onboarding/,   title: "Welcome" },
];

function sectionFor(path: string) {
  return SECTION_TITLES.find((s) => s.match.test(path))?.title ?? "";
}

function initials(email: string) {
  const trimmed = email.trim();
  if (!trimmed) return "?";
  const local = trimmed.split("@")[0];
  const parts = local.split(/[._\-]/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return local.slice(0, 2).toUpperCase();
}

export function TopBar({ email }: { email: string }) {
  const path = usePathname();
  const title = sectionFor(path);
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Hide title on dashboard — the greeting masthead already names the page.
  // The /daily greeting already names the page; hide the redundant title there.
  const showTitle = title && !path.startsWith("/daily") && !path.startsWith("/dashboard");

  return (
    <header className="h-16 border-b border-[var(--border)] bg-[var(--bg)] flex items-center justify-between px-5 lg:px-8">
      <div className="min-w-0">
        {showTitle && (
          <h2 className="text-[15px] font-medium text-[var(--text)] truncate">{title}</h2>
        )}
      </div>

      <div className="flex items-center gap-2" ref={menuRef}>
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={open}
            className={cn(
              "inline-flex items-center gap-2 h-9 pl-1 pr-2 rounded-[var(--radius)]",
              "hover:bg-[var(--surface-2)] transition-colors"
            )}
          >
            <span
              className="h-7 w-7 rounded-full inline-flex items-center justify-center bg-[var(--accent-soft)] text-[var(--accent)] text-[11px] font-semibold t-num"
              aria-hidden
            >
              {initials(email)}
            </span>
            <ChevronDown
              size={13}
              strokeWidth={1.5}
              className={cn(
                "text-[var(--text-subtle)] transition-transform",
                open && "rotate-180"
              )}
              aria-hidden
            />
          </button>

          {open && (
            <div
              role="menu"
              className={cn(
                "absolute right-0 top-[calc(100%+6px)] z-40 w-[240px] p-1.5",
                "rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)]",
                "shadow-[var(--shadow-md)]"
              )}
            >
              <div className="px-3 py-2 border-b border-[var(--border-soft)] mb-1">
                <p className="t-caption text-[var(--text-subtle)] mb-0.5">Signed in</p>
                <p className="text-xs font-mono text-[var(--text)] truncate" title={email}>
                  {email}
                </p>
              </div>
              <form action={signOutAction}>
                <button
                  type="submit"
                  role="menuitem"
                  className="w-full flex items-center gap-2 px-3 h-9 rounded-[var(--radius-sm)] text-sm text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
                >
                  <LogOut size={14} strokeWidth={1.5} className="text-[var(--text-subtle)]" />
                  Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
