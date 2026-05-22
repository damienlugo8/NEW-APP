"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Flame,
  Utensils,
  ShieldOff,
  Users,
  Anvil,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; icon: LucideIcon; soon?: boolean };

/**
 * Sidebar — desktop only (lg+). Active state is a left-edge ember rail
 * (Linear/Notion idiom). Hard 75 sits in its own "PROGRAMS" section so it
 * reads as the wedge offering, not just another tab.
 *
 * NOTE: routes still resolve to the old notary paths until the per-tab
 * pages are rebuilt — this is the brand-reading layer landing first.
 */
const NAV: Item[] = [
  { href: "/daily",        label: "Daily",   icon: Flame },
  { href: "/journal",      label: "Fuel",    icon: Utensils },
  { href: "/pipeline",     label: "Squad",   icon: Users },
];

const PROGRAMS: Item[] = [
  { href: "/hard-75", label: "Hard 75", icon: Anvil },
];

const SOON: Item[] = [
  { href: "/block",    label: "Block",     icon: ShieldOff, soon: true },
];

function NavLink({ item, active }: { item: Item; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.soon ? "#" : item.href}
      aria-disabled={item.soon}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 px-3 h-9 rounded-[8px] text-sm",
        "transition-colors duration-150",
        active
          ? "bg-[var(--surface)] text-[var(--text)]"
          : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]",
        item.soon && "opacity-55 cursor-default hover:bg-transparent hover:text-[var(--text-muted)]"
      )}
    >
      {/* Active rail — sits flush against the sidebar's left edge */}
      <span
        className={cn(
          "absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r-full transition-opacity",
          active ? "bg-[var(--accent)] opacity-100" : "opacity-0"
        )}
        aria-hidden
      />
      <Icon
        size={15}
        strokeWidth={1.5}
        className={cn(
          "shrink-0 transition-colors",
          active ? "text-[var(--accent)]" : "text-[var(--text-subtle)] group-hover:text-[var(--text-muted)]"
        )}
      />
      <span className="flex-1 truncate">{item.label}</span>
      {item.soon && (
        <span className="text-[10px] tracking-wide text-[var(--text-subtle)]">soon</span>
      )}
    </Link>
  );
}

export function Sidebar() {
  const path = usePathname();
  const isActive = (href: string) => path === href || path.startsWith(href + "/");
  return (
    <aside className="hidden lg:flex flex-col w-[240px] shrink-0 border-r border-[var(--border)] bg-[var(--surface-2)]">
      <div className="px-5 h-16 flex items-center">
        <Link href="/daily" className="text-[var(--text)]"><Logo /></Link>
      </div>

      <nav className="flex-1 px-2 pt-2 flex flex-col gap-0.5">
        {NAV.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}

        <div className="mt-6 mb-2 px-3">
          <p className="t-caption text-[var(--text-subtle)]">Programs</p>
        </div>
        {PROGRAMS.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}

        <div className="mt-6 mb-2 px-3">
          <p className="t-caption text-[var(--text-subtle)]">Coming soon</p>
        </div>
        {SOON.map((item) => (
          <NavLink key={item.href} item={item} active={false} />
        ))}
      </nav>

      <div className="p-2 border-t border-[var(--border-soft)]">
        <NavLink
          item={{ href: "/settings", label: "Settings", icon: Settings }}
          active={isActive("/settings")}
        />
      </div>
    </aside>
  );
}
