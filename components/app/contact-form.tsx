"use client";

import { useActionState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  saveContactAction,
  type ContactFormState,
} from "@/app/(app)/pipeline/actions";
import { CONTACT_STAGES, type Contact, type ContactStage } from "@/lib/types/contact";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;
const initial: ContactFormState = {};

export function ContactForm({
  open,
  onClose,
  editing,
  defaultStage = "prospect",
}: {
  open: boolean;
  onClose: () => void;
  editing?: Contact | null;
  defaultStage?: ContactStage;
}) {
  const reduce = useReducedMotion();
  const [state, action, pending] = useActionState(saveContactAction, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);

  useEffect(() => {
    if (!open) return;
    const on = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.18 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={editing ? "Edit contact" : "New contact"}
            className={cn(
              "fixed z-50 bg-[var(--bg)] border-l border-[var(--border)] shadow-[var(--shadow-lg)]",
              "right-0 top-0 h-[100dvh] w-full sm:w-[440px] flex flex-col"
            )}
            initial={{ x: reduce ? 0 : "100%" }}
            animate={{ x: 0 }}
            exit={{ x: reduce ? 0 : "100%" }}
            transition={{ duration: reduce ? 0 : 0.32, ease }}
          >
            <header className="h-14 px-5 flex items-center justify-between border-b border-[var(--border)]">
              <h3 className="t-h3 text-base">
                {editing ? "Edit contact" : "New contact"}
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Close"
              >
                <X size={16} strokeWidth={1.75} />
              </Button>
            </header>

            <form
              ref={formRef}
              action={action}
              className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4"
            >
              {editing?.id && <input type="hidden" name="id" value={editing.id} />}

              <Input
                name="company_name"
                label="Company"
                defaultValue={editing?.company_name ?? ""}
                placeholder="First American Title"
                error={state.fieldErrors?.company_name}
                autoFocus
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-[1.4fr_1fr] gap-3">
                <Input
                  name="contact_name"
                  label="Contact name"
                  defaultValue={editing?.contact_name ?? ""}
                  placeholder="Jenny Patel"
                />
                <Input
                  name="contact_role"
                  label="Role"
                  defaultValue={editing?.contact_role ?? ""}
                  placeholder="Closing coordinator"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  name="email"
                  type="email"
                  label="Email"
                  defaultValue={editing?.email ?? ""}
                  placeholder="jenny@firstam.com"
                  error={state.fieldErrors?.email}
                />
                <Input
                  name="phone"
                  type="tel"
                  label="Phone"
                  defaultValue={editing?.phone ?? ""}
                  placeholder="(201) 555-0134"
                />
              </div>

              <Input
                name="address"
                label="Office address"
                defaultValue={editing?.address ?? ""}
                placeholder="Optional"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  name="stage"
                  label="Stage"
                  defaultValue={editing?.stage ?? defaultStage}
                >
                  {CONTACT_STAGES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </Select>
                <Input
                  name="next_followup_at"
                  type="date"
                  label="Next follow-up"
                  defaultValue={
                    editing?.next_followup_at
                      ? editing.next_followup_at.slice(0, 10)
                      : ""
                  }
                />
              </div>

              <Textarea
                name="notes"
                label="Notes"
                rows={4}
                defaultValue={editing?.notes ?? ""}
                placeholder="What they do, who refers, what they need, anything important."
              />

              {state.error && (
                <p className="text-sm text-[var(--danger)]">{state.error}</p>
              )}
            </form>

            <footer className="h-16 px-5 border-t border-[var(--border)] flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                loading={pending}
                onClick={() => formRef.current?.requestSubmit()}
              >
                {editing ? "Save changes" : "Add contact"}
              </Button>
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
