import { cn } from "@/lib/utils";

/**
 * NotaryFlow wordmark. The mark is a notarial seal abstracted into a single
 * stroked arc + ledger line — references the craft without using a cliché
 * stamp icon. Stroke matches body text color so it adapts to light/dark.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7.5 13.5 L11 16 L16.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="font-medium tracking-tight text-[15px]">NotaryFlow</span>
    </span>
  );
}
