"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helper?: string;
  error?: string;
}

/**
 * Native <select> styled to match Input. We keep it native (not a custom
 * combobox) so it gets free native picker UX on mobile — the iOS wheel for
 * states and document types is unbeatable.
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, helper, error, id, children, ...props }, ref) => {
    const reactId = React.useId();
    const inputId = id ?? reactId;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="t-caption text-[var(--text-muted)]">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={inputId}
            aria-invalid={!!error || undefined}
            className={cn(
              "h-11 w-full appearance-none px-3 pr-9 bg-[var(--surface)] text-[var(--text)] " +
                "border border-[var(--border-strong)] rounded-[var(--radius-sm)] " +
                "transition-colors duration-150 " +
                "focus:outline-none focus:border-[var(--accent)] focus:ring-0 " +
                "disabled:opacity-50",
              error && "border-[var(--danger)] focus:border-[var(--danger)]",
              className
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown
            size={15}
            strokeWidth={1.75}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          />
        </div>
        {error ? (
          <p className="text-sm text-[var(--danger)]">{error}</p>
        ) : helper ? (
          <p className="text-sm text-[var(--text-subtle)]">{helper}</p>
        ) : null}
      </div>
    );
  }
);
Select.displayName = "Select";
