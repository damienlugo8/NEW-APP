"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  KanbanSquare,
  Users,
  Receipt,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; icon: LucideIcon; soon?: boolean };

const NAV: Item[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calendar",  label: "Calendar",  icon: CalendarDays, soon: true },
  { href: "/journal",   label: "Journal",   icon: BookOpen, soon: true },
  { href: "/pipeline",  label: "Pipeline",  icon: KanbanSquare, soon: true },
  { href: "/clients",   label: "Clients",   icon: Users, soon: true },
  { href: "/invoices",  label: "Invoices",  icon: Receipt, soon: true },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="hidden lg:flex flex-col w-[240px] shrink-0 border-r border-[var(--border)] bg-[var(--surface-2)]">
      <div className="px-5 h-16 flex items-center border-b border-[var(--border)]">
        <Link href="/dashboard" className="text-[var(--text)]"><Logo /></Link>
      </div>
      <nav className="flex-1 p-3 flex flex-col gap-0.5">
        {NAV.map((item) => {
          const active = path === item.href || path.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.soon ? "#" : item.href}
              aria-disabled={item.soon}
              className={cn(
                "group flex items-center justify-between gap-3 px-3 h-9 rounded-[8px] text-sm",
                "transition-colors duration-150",
                active
                  ? "bg-[var(--surface)] text-[var(--text)] border border-[var(--border)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]",
                item.soon && "opacity-60 cursor-default"
              )}
            >
              <span className="flex items-center gap-3">
                <Icon size={15} strokeWidth={1.75} />
                {item.label}
              </span>
              {item.soon && (
                <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-subtle)]">
                  soon
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-[var(--border)]">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 h-9 rounded-[8px] text-sm",
            path.startsWith("/settings")
              ? "bg-[var(--surface)] text-[var(--text)] border border-[var(--border)]"
              : "text-[var(--text-muted)] hover:text-[var(--text)]"
          )}
        >
          <Settings size={15} strokeWidth={1.75} />
          Settings
        </Link>
      </div>
    </aside>
  );
}
