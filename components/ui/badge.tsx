import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "accent" | "success" | "warning" | "danger";

export function Badge({
  tone = "neutral",
  className,
  children,
  ...props
}: { tone?: Tone } & React.HTMLAttributes<HTMLSpanElement>) {
  const tones: Record<Tone, string> = {
    neutral: "bg-[var(--surface-2)] text-[var(--text-muted)]",
    accent:  "bg-[var(--accent-soft)] text-[var(--accent)]",
    success: "bg-[color-mix(in_oklab,var(--success)_15%,transparent)] text-[var(--success)]",
    warning: "bg-[color-mix(in_oklab,var(--warning)_15%,transparent)] text-[var(--warning)]",
    danger:  "bg-[color-mix(in_oklab,var(--danger)_15%,transparent)] text-[var(--danger)]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
        tones[tone],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
