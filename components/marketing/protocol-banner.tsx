"use client";

import { useEffect, useState, useTransition } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { captureProtocolLead } from "@/app/(marketing)/actions";

const ease = [0.16, 1, 0.3, 1] as const;
const DISMISS_KEY = "forge-protocol-dismissed";

/**
 * Sticky lead-capture banner for "The FORGE Protocol" PDF. Appears once the
 * visitor scrolls past the hero, pinned to the bottom. Email → Resend via the
 * captureProtocolLead action. Dismissal is remembered in localStorage.
 */
export function ProtocolBanner() {
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(true); // assume dismissed until we read storage
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Read dismissal once on mount.
  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  // Reveal after scrolling past the hero (~90vh).
  useEffect(() => {
    if (dismissed) return;
    const onScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 0.9);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [dismissed]);

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
    setVisible(false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await captureProtocolLead(email);
      if (!res.ok) {
        setError(res.error ?? "Something broke. Try again.");
        return;
      }
      setDone(true);
      // Remember so it doesn't reappear on the next visit.
      try {
        localStorage.setItem(DISMISS_KEY, "1");
      } catch {
        /* ignore */
      }
    });
  }

  const show = visible && !dismissed;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={reduce ? { opacity: 0 } : { y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { y: "100%", opacity: 0 }}
          transition={{ duration: 0.4, ease }}
          className="fixed inset-x-0 bottom-0 z-50 border-t border-[#FF6B1A] bg-[#161616]"
        >
          <div className="mx-auto flex max-w-[1100px] flex-col items-center gap-3 px-5 py-3.5 sm:flex-row sm:justify-between sm:gap-6">
            {done ? (
              <p className="flex-1 text-center text-[14px] text-white sm:text-left">
                Check your inbox — the Protocol is on its way.
              </p>
            ) : (
              <>
                <p className="flex-1 text-center text-[14px] text-[#D4D4D4] sm:text-left">
                  <span className="font-medium text-white">Free download:</span>{" "}
                  The FORGE Protocol. 30-page 75 Hard guide.
                </p>
                <form
                  onSubmit={submit}
                  className="flex w-full items-center gap-2 sm:w-auto"
                >
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    aria-label="Email address"
                    className="h-10 w-full min-w-0 rounded-[8px] border border-[#2A2A2A] bg-[#0E0D0C] px-3 text-[14px] text-white placeholder:text-[#6B6B6B] focus:border-[#FF6B1A] focus:outline-none sm:w-[220px]"
                  />
                  <button
                    type="submit"
                    disabled={pending}
                    className="inline-flex h-10 shrink-0 items-center justify-center rounded-[8px] bg-[#FF6B1A] px-4 text-[14px] font-medium text-[#0A0A0A] transition-[filter] duration-150 hover:brightness-110 disabled:opacity-60"
                  >
                    {pending ? "Sending…" : "Send it"}
                  </button>
                </form>
              </>
            )}

            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss"
              className="absolute right-3 top-3 text-[#6B6B6B] transition-colors hover:text-white sm:static"
            >
              <X size={18} strokeWidth={1.75} />
            </button>
          </div>
          {error && (
            <p className="px-5 pb-2 text-center text-[12px] text-[#EF4444] sm:text-left">
              {error}
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
