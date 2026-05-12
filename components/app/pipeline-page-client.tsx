"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { KanbanSquare, List, Plus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PipelineKanban } from "@/components/app/pipeline-kanban";
import { ContactForm } from "@/components/app/contact-form";
import { ContactList } from "@/components/app/contact-list";
import { type Contact } from "@/lib/types/contact";
import { cn } from "@/lib/utils";

type View = "kanban" | "list";

export function PipelinePageClient({
  contacts,
  overdueCount,
}: {
  contacts: Contact[];
  overdueCount: number;
}) {
  const [view, setView] = useState<View>("kanban");
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  return (
    <div className="mx-auto max-w-[1400px] px-5 lg:px-8 py-8 pb-24 lg:pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <p className="t-caption text-[var(--text-subtle)] mb-2">Pipeline</p>
          <h1 className="t-h1">
            {contacts.length === 0
              ? "Build your book."
              : overdueCount === 0
              ? `${contacts.length} ${contacts.length === 1 ? "contact" : "contacts"}.`
              : `${overdueCount} ${overdueCount === 1 ? "contact needs" : "contacts need"} a nudge.`}
          </h1>
          <p className="t-body text-[var(--text-muted)] mt-2 max-w-[64ch]">
            Drag a contact across the board as your relationship moves. Tap to
            open and log a call, send an email, or set a follow-up reminder.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-0.5">
            <ToggleBtn
              active={view === "kanban"}
              onClick={() => setView("kanban")}
              label="Board"
              icon={<KanbanSquare size={14} strokeWidth={1.75} />}
            />
            <ToggleBtn
              active={view === "list"}
              onClick={() => setView("list")}
              label="List"
              icon={<List size={14} strokeWidth={1.75} />}
            />
          </div>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus size={14} strokeWidth={2} /> New contact
          </Button>
        </div>
      </div>

      {contacts.length === 0 ? (
        <EmptyState onAdd={() => setOpen(true)} />
      ) : (
        <AnimatePresence mode="wait">
          {view === "kanban" ? (
            <motion.div
              key="k"
              initial={{ opacity: 0, y: reduce ? 0 : 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduce ? 0 : -6 }}
              transition={{ duration: 0.18 }}
            >
              <PipelineKanban contacts={contacts} />
            </motion.div>
          ) : (
            <motion.div
              key="l"
              initial={{ opacity: 0, y: reduce ? 0 : 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduce ? 0 : -6 }}
              transition={{ duration: 0.18 }}
            >
              <ContactList contacts={contacts} />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      <ContactForm open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function ToggleBtn({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-8 px-3 text-sm inline-flex items-center gap-1.5 rounded-[6px] transition-colors",
        active
          ? "bg-[var(--surface-2)] text-[var(--text)]"
          : "text-[var(--text-muted)] hover:text-[var(--text)]"
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center">
      <KanbanSquare
        size={26}
        strokeWidth={1.5}
        className="mx-auto text-[var(--text-subtle)]"
      />
      <h2 className="t-h3 mt-4">No contacts yet.</h2>
      <p className="mt-1 text-sm text-[var(--text-muted)] max-w-[44ch] mx-auto">
        Add a title company, escrow officer, or signing service you&apos;d like
        to work with. NotaryFlow tracks every email, call, and follow-up so
        nothing slips.
      </p>
      <div className="mt-5 flex items-center justify-center gap-2 text-xs text-[var(--text-subtle)]">
        <Clock size={12} strokeWidth={1.75} />
        Most notaries start with 3–5 firms.
      </div>
      <Button className="mt-5" onClick={onAdd}>
        <Plus size={14} strokeWidth={2} /> Add your first contact
      </Button>
    </div>
  );
}
