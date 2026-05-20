"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  KanbanSquare,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = { href: string; label: string; icon: LucideIcon };

const TABS: Tab[] = [
  { href: "/dashboard",    label: "Home",     icon: LayoutDashboard },
  { href: "/appointments", label: "Calendar", icon: CalendarDays },
  { href: "/journal",      label: "Journal",  icon: BookOpen },
  { href: "/pipeline",     label: "Pipeline", icon: KanbanSquare },
  { href: "/settings",     label: "Settings", icon: Settings },
];

/**
 * Mobile-only bottom tab bar (visible below lg). The active tab gets a
 * top-edge accent rail — a quieter cue than a filled icon, and consistent
 * with the desktop sidebar's left-edge rail. Backdrop-blur sits on a
 * semi-transparent surface so content scrolling under it stays legible.
 *
 * Hidden via print: utility so a printed journal entry doesn't include it.
 * Safe-area inset keeps it above the iOS home indicator.
 */
export function MobileNav() {
  const path = usePathname();
  return (
    <nav
      role="navigation"
      aria-label="Primary"
      className={cn(
        "lg:hidden print:hidden fixed inset-x-0 bottom-0 z-30",
        "bg-[color-mix(in_oklab,var(--bg)_88%,transparent)] backdrop-blur-md",
        "border-t border-[var(--border)]",
        "pb-[env(safe-area-inset-bottom)]"
      )}
    >
      <ul className="grid grid-cols-5">
        {TABS.map((t) => {
          const active =
            path === t.href ||
            (t.href !== "/dashboard" && path.startsWith(t.href));
          const Icon = t.icon;
          return (
            <li key={t.href} className="flex">
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-[60px]",
                  "transition-colors duration-150",
                  active
                    ? "text-[var(--accent)]"
                    : "text-[var(--text-subtle)] hover:text-[var(--text)]"
                )}
              >
                {/* Top-edge accent rail mirrors the desktop sidebar idiom */}
                <span
                  className={cn(
                    "absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-8 rounded-b-full",
                    "transition-opacity duration-150",
                    active
                      ? "bg-[var(--accent)] opacity-100"
                      : "opacity-0"
                  )}
                  aria-hidden
                />
                <Icon
                  size={19}
                  strokeWidth={active ? 1.75 : 1.5}
                  aria-hidden
                />
                <span
                  className={cn(
                    "text-[10px] tracking-wide",
                    active ? "font-semibold" : "font-medium"
                  )}
                >
                  {t.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
