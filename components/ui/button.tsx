"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Button — three variants, three sizes. Active state nudges 1px (tactile),
 * focus uses the accent outline. Transitions are intentional (150ms color,
 * 200ms transform) and respect prefers-reduced-motion via globals.css.
 */
const button = cva(
  "relative inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap " +
    "transition-[color,background-color,border-color,transform] duration-150 " +
    "active:translate-y-px disabled:opacity-50 disabled:pointer-events-none " +
    "rounded-[var(--radius)] select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--accent)] text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] " +
          "shadow-[var(--shadow-sm)]",
        secondary:
          "bg-[var(--surface)] text-[var(--text)] border border-[var(--border-strong)] " +
          "hover:bg-[var(--surface-2)]",
        ghost:
          "bg-transparent text-[var(--text)] hover:bg-[var(--surface-2)]",
        link:
          "bg-transparent text-[var(--text)] underline-offset-4 hover:underline px-0 h-auto",
        danger:
          "bg-[var(--danger)] text-white hover:opacity-90",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-4 text-[15px]",
        lg: "h-12 px-5 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(button({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <Spinner />
            <span className="opacity-80">{children}</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = "Button";

function Spinner() {
  return (
    <svg
      className="animate-spin"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
