"use client";

import { useTheme } from "./theme-provider";
import { Moon, Sun, Monitor, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const opts: { value: "light" | "system" | "dark"; icon: LucideIcon; label: string }[] = [
    { value: "light",  icon: Sun,     label: "Light" },
    { value: "system", icon: Monitor, label: "System" },
    { value: "dark",   icon: Moon,    label: "Dark" },
  ];
  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className={cn(
        "inline-flex p-0.5 rounded-[var(--radius)] bg-[var(--surface-2)] border border-[var(--border)]",
        className
      )}
    >
      {opts.map(({ value, icon: Icon, label }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            role="radio"
            aria-checked={active}
            title={label}
            onClick={() => setTheme(value)}
            className={cn(
              "h-7 w-7 inline-flex items-center justify-center rounded-[6px] transition-colors duration-150",
              active
                ? "bg-[var(--surface)] text-[var(--text)] shadow-[var(--shadow-sm)]"
                : "text-[var(--text-muted)] hover:text-[var(--text)]"
            )}
          >
            <Icon size={14} strokeWidth={1.75} />
          </button>
        );
      })}
    </div>
  );
}
