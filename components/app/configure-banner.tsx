import { Sparkles } from "lucide-react";

/**
 * Shown above the app when Supabase env vars aren't set. We let the user
 * browse the UI so they can fall in love before the setup, then nudge them
 * toward the README to wire up real auth.
 */
export function ConfigureBanner() {
  return (
    <div className="border-b border-[var(--border-soft)] bg-[color-mix(in_oklab,var(--accent)_8%,transparent)] px-5 lg:px-8 py-3 flex items-start gap-3 text-sm">
      <span
        className="mt-0.5 shrink-0 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]"
        aria-hidden
      >
        <Sparkles size={11} strokeWidth={1.5} />
      </span>
      <p className="text-[var(--text-muted)]">
        <span className="text-[var(--text)] font-medium">Demo mode.</span>{" "}
        You&apos;re seeing the real interface with placeholder data. Copy{" "}
        <code className="font-mono text-xs px-1 py-0.5 bg-[var(--surface-2)] border border-[var(--border-soft)] rounded">
          .env.example
        </code>{" "}
        to{" "}
        <code className="font-mono text-xs px-1 py-0.5 bg-[var(--surface-2)] border border-[var(--border-soft)] rounded">
          .env.local
        </code>{" "}
        with your Supabase keys to enable real auth — see README.
      </p>
    </div>
  );
}
