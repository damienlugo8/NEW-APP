"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Card } from "./profile-section";
import { Button } from "@/components/ui/button";
import { deleteAccount } from "./actions";

const ARM_DELAY_MS = 3000;

export function DangerZone() {
  const [open, setOpen] = useState(false);

  return (
    <section
      className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6"
      style={{ borderTop: "1px solid color-mix(in oklab, var(--danger) 40%, transparent)" }}
    >
      <p
        className="text-[12px] uppercase tracking-[0.1em] font-medium text-[var(--danger)] mb-1"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        Danger zone
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-[17px] font-semibold text-[var(--text)]">Delete my account</h2>
          <p className="text-sm text-[var(--text-subtle)] mt-1">
            Permanently erase your account, progress, and data. This cannot be undone.
          </p>
        </div>
        <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
          Delete account
        </Button>
      </div>

      {open && <DeleteModal onClose={() => setOpen(false)} />}
    </section>
  );
}

function DeleteModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [confirm, setConfirm] = useState("");
  const [armed, setArmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  // 3-second cool-off before the confirm button can fire — forces a beat of
  // thought before an irreversible action.
  useEffect(() => {
    const t = setTimeout(() => setArmed(true), ARM_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  // Lock background scroll + allow Escape to close.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !pending && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose, pending]);

  const canConfirm = armed && confirm.trim() === "FORGE" && !pending;

  function handleDelete() {
    setError(null);
    start(async () => {
      const res = await deleteAccount(confirm);
      if (res.ok) {
        router.replace("/");
        return;
      }
      setError(res.error ?? "Couldn't delete the account.");
    });
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-title"
      onClick={() => !pending && onClose()}
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="w-full max-w-[440px] rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-2)] p-5 sm:p-6 shadow-[var(--shadow-md)]"
        onClick={(e) => e.stopPropagation()}
        initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      >
        <h3 id="delete-title" className="text-[18px] font-semibold text-[var(--text)]">
          Delete your account?
        </h3>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          This erases everything — habits, streaks, your 75 Hard run, squad
          membership, and billing. We cancel any active subscription. This can&apos;t
          be undone.
        </p>

        <label
          htmlFor="delete-confirm"
          className="mt-5 block text-sm text-[var(--text-muted)]"
        >
          Type <span className="font-semibold text-[var(--text)]" style={{ fontFamily: "var(--font-mono)" }}>FORGE</span> to confirm.
        </label>
        <input
          id="delete-confirm"
          value={confirm}
          autoFocus
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="FORGE"
          className="mt-2 h-11 w-full px-3 bg-[var(--surface)] text-[var(--text)] border border-[var(--border-strong)] rounded-[var(--radius-sm)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--danger)]"
          style={{ fontFamily: "var(--font-mono)" }}
        />

        {error && <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>}

        <div className="mt-6 flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={pending}>
            Keep my account
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            disabled={!canConfirm}
            loading={pending}
          >
            {armed ? "Delete forever" : "Hold on…"}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
