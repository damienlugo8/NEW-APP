import { AlertTriangle } from "lucide-react";

export function ConfigureBanner() {
  return (
    <div className="border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--warning)_10%,transparent)] px-5 lg:px-8 py-3 flex items-start gap-3 text-sm">
      <AlertTriangle size={16} strokeWidth={1.75} className="text-[var(--warning)] mt-0.5 shrink-0" />
      <p className="text-[var(--text-muted)]">
        <span className="text-[var(--text)] font-medium">Demo mode.</span> Supabase isn&apos;t
        configured yet, so sign-in is bypassed. Copy <code className="font-mono text-xs px-1 py-0.5 bg-[var(--surface-2)] rounded">.env.example</code> to{" "}
        <code className="font-mono text-xs px-1 py-0.5 bg-[var(--surface-2)] rounded">.env.local</code> and add your Supabase keys to enable real auth — see README.
      </p>
    </div>
  );
}
