"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  Flame,
  Utensils,
  Anvil,
  Users,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = { href: string; label: string; icon: LucideIcon };

/**
 * Bottom tabs on mobile. Five slots, capped intentionally — BLOCK lives
 * behind Settings (or under Hard 75 once it exists). The active tab gets
 * an ember top-edge rail (sliding via layoutId) mirroring the desktop
 * sidebar idiom. Labels show on the active tab only — icons carry the rest.
 */
const TABS: Tab[] = [
  { href: "/daily",        label: "Daily",    icon: Flame },
  { href: "/fuel",         label: "Fuel",     icon: Utensils },
  { href: "/hard-75",      label: "Hard 75",  icon: Anvil },
  { href: "/squad",        label: "Squad",    icon: Users },
  { href: "/settings",     label: "Settings", icon: Settings },
];

export function MobileNav() {
  const path = usePathname();
  const reduceMotion = useReducedMotion();
  return (
    <nav
      role="navigation"
      aria-label="Primary"
      className={cn(
        "lg:hidden print:hidden fixed inset-x-0 bottom-0 z-30",
        "backdrop-blur-sm border-t border-[var(--border)]",
        "pb-[env(safe-area-inset-bottom)]"
      )}
      // Solid near-black with a whisper of blur underneath — reads opaque.
      style={{ backgroundColor: "color-mix(in oklab, var(--bg) 97%, transparent)" }}
    >
      <ul className="grid grid-cols-5">
        {TABS.map((t) => {
          const active =
            path === t.href ||
            (t.href !== "/daily" && path.startsWith(t.href));
          const Icon = t.icon;
          return (
            <li key={t.href} className="flex">
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex-1 flex flex-col items-center justify-center gap-1 h-[60px]",
                  "transition-colors duration-200",
                  active
                    ? "text-[var(--accent)]"
                    : "text-[var(--text-subtle)] hover:text-[var(--text)]"
                )}
              >
                {/* Sliding ember rail above the active icon */}
                {active && (
                  <motion.span
                    layoutId="mobile-nav-indicator"
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : { duration: 0.25, ease: [0.16, 1, 0.3, 1] }
                    }
                    className="absolute top-0 inset-x-0 mx-auto h-[2px] w-8 rounded-b-full bg-[var(--accent)]"
                    aria-hidden
                  />
                )}
                <Icon size={24} strokeWidth={1.75} aria-hidden />
                {/* Label slot is always rendered so the icon never shifts
                    when the ember rail slides — it only fades in when active.
                    The text stays in the accessibility tree either way. */}
                <span
                  className={cn(
                    "text-[10px] font-medium leading-none tracking-wide",
                    "transition-opacity duration-200",
                    active ? "opacity-100" : "opacity-0"
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
