"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helper?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, helper, error, id, ...props }, ref) => {
    const reactId = React.useId();
    const inputId = id ?? reactId;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="t-caption text-[var(--text-muted)]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error || undefined}
          aria-describedby={
            error ? `${inputId}-err` : helper ? `${inputId}-help` : undefined
          }
          className={cn(
            "h-11 w-full px-3 bg-[var(--surface)] text-[var(--text)] " +
              "border border-[var(--border-strong)] rounded-[var(--radius-sm)] " +
              "placeholder:text-[var(--text-subtle)] " +
              "transition-colors duration-150 " +
              "focus:outline-none focus:border-[var(--accent)] focus:ring-0 " +
              "disabled:opacity-50",
            error && "border-[var(--danger)] focus:border-[var(--danger)]",
            className
          )}
          {...props}
        />
        {error ? (
          <p id={`${inputId}-err`} className="text-sm text-[var(--danger)]">
            {error}
          </p>
        ) : helper ? (
          <p id={`${inputId}-help`} className="text-sm text-[var(--text-subtle)]">
            {helper}
          </p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";
