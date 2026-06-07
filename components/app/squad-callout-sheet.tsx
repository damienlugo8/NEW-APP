"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X, Megaphone, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { SquadMember } from "@/lib/types/squad";

/**
 * SQUAD — callout sheet.
 *
 * The only interaction in SQUAD. Pick a preset line (or write your own,
 * capped short) and fire it at a squadmate. No threads, no replies — it
 * lands as a one-shot notification on their end. Bottom sheet on mobile,
 * centered on desktop, same idiom as the FUEL meal sheet.
 */
export function SquadCalloutSheet({
  target,
  onClose,
  onSend,
}: {
  target: SquadMember | null;
  onClose: () => void;
  onSend: (
    m: SquadMember,
    message: string
  ) => Promise<{ ok: boolean; error?: string }>;
}) {
  const reduce = useReducedMotion();
  const [message, setMessage] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const presets = React.useMemo(
    () =>
      target
        ? [
            `Call out ${target.handle} to hit S-tier this week.`,
            `${target.handle} — don't break the chain. We're watching.`,
            `Respect, ${target.handle}. Now go further.`,
          ]
        : [],
    [target]
  );

  React.useEffect(() => {
    if (target) {
      setMessage(presets[0] ?? "");
      setError(null);
      setSending(false);
    }
  }, [target, presets]);

  React.useEffect(() => {
    if (!target) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [target, onClose]);

  async function handleSend() {
    if (!target || !message.trim()) return;
    setSending(true);
    setError(null);
    const res = await onSend(target, message.trim());
    setSending(false);
    if (!res.ok) {
      setError(res.error ?? "Couldn't send. Try again.");
      return;
    }
    onClose();
  }

  return (
    <AnimatePresence>
      {target && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Call out ${target.handle}`}
            initial={reduce ? false : { y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { y: 40, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "relative w-full sm:max-w-[460px]",
              "bg-[var(--surface)] border border-[var(--border)]",
              "rounded-t-[var(--radius)] sm:rounded-[var(--radius)]",
              "shadow-[var(--shadow-md)] pb-[env(safe-area-inset-bottom)]"
            )}
          >
            <header className="flex items-center justify-between px-5 h-12 border-b border-[var(--border-soft)]">
              <div className="flex items-center gap-2">
                <Megaphone size={15} strokeWidth={1.75} className="text-[var(--accent)]" />
                <p className="text-sm font-medium text-[var(--text)]">
                  Call out {target.handle}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="h-8 w-8 inline-flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-subtle)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition-colors"
                aria-label="Close"
              >
                <X size={15} strokeWidth={1.5} />
              </button>
            </header>

            <div className="p-5 space-y-3">
              <div className="flex flex-wrap gap-2">
                {presets.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setMessage(p)}
                    className={cn(
                      "text-[12px] px-2.5 py-1.5 rounded-full border transition-colors text-left",
                      message === p
                        ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-soft)]"
                        : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 140))}
                rows={3}
                className={cn(
                  "w-full px-3 py-2 rounded-[var(--radius-sm)] bg-[var(--bg)]",
                  "border border-[var(--border)] text-sm text-[var(--text)] resize-none",
                  "focus:outline-none focus:border-[var(--accent)] transition-colors"
                )}
                placeholder="Say your piece…"
              />
              <p className="t-caption text-[var(--text-subtle)] text-right">
                {message.length}/140
              </p>

              {error && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] bg-[color-mix(in_oklab,var(--danger,#dc2626)_18%,transparent)] text-[12px] text-[var(--danger,#dc2626)]">
                  <AlertTriangle size={13} strokeWidth={1.75} />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <Button onClick={handleSend} disabled={sending || !message.trim()}>
                  {sending ? "Sending…" : "Send callout"}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
