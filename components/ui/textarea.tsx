"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helper?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, helper, error, id, rows = 4, ...props }, ref) => {
    const reactId = React.useId();
    const inputId = id ?? reactId;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="t-caption text-[var(--text-muted)]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          aria-invalid={!!error || undefined}
          className={cn(
            "w-full px-3 py-2.5 bg-[var(--surface)] text-[var(--text)] " +
              "border border-[var(--border-strong)] rounded-[var(--radius-sm)] " +
              "placeholder:text-[var(--text-subtle)] " +
              "transition-colors duration-150 resize-y " +
              "focus:outline-none focus:border-[var(--accent)] focus:ring-0 " +
              "disabled:opacity-50",
            error && "border-[var(--danger)] focus:border-[var(--danger)]",
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-sm text-[var(--danger)]">{error}</p>
        ) : helper ? (
          <p className="text-sm text-[var(--text-subtle)]">{helper}</p>
        ) : null}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
