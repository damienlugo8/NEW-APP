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
  { href: "/dashboard",    label: "Home",       icon: LayoutDashboard },
  { href: "/appointments", label: "Calendar",   icon: CalendarDays },
  { href: "/journal",      label: "Journal",    icon: BookOpen },
  { href: "/pipeline",     label: "Pipeline",   icon: KanbanSquare },
  { href: "/settings",     label: "Settings",   icon: Settings },
];

/**
 * Mobile-only bottom tab bar. Visible below lg. Uses
 * env(safe-area-inset-bottom) so it sits above the iOS home indicator.
 *
 * Hidden via print: utility so a printed journal entry doesn't include it.
 */
export function MobileNav() {
  const path = usePathname();
  return (
    <nav
      role="navigation"
      aria-label="Primary"
      className={cn(
        "lg:hidden print:hidden fixed inset-x-0 bottom-0 z-30",
        "bg-[color-mix(in_oklab,var(--bg)_92%,transparent)] backdrop-blur",
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
                  "flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-[56px]",
                  "transition-colors duration-150",
                  active
                    ? "text-[var(--accent)]"
                    : "text-[var(--text-subtle)] hover:text-[var(--text)]"
                )}
              >
                <Icon
                  size={18}
                  strokeWidth={active ? 2 : 1.75}
                  aria-hidden
                />
                <span
                  className={cn(
                    "text-[10px] font-medium",
                    active && "font-semibold"
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
