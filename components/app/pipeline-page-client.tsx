"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { KanbanSquare, List, Plus, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PipelineKanban } from "@/components/app/pipeline-kanban";
import { ContactForm } from "@/components/app/contact-form";
import { ContactList } from "@/components/app/contact-list";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
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
      <PageHeader
        eyebrow="Pipeline"
        title={
          contacts.length === 0
            ? "Build your book."
            : overdueCount === 0
            ? `${contacts.length} ${contacts.length === 1 ? "contact" : "contacts"}.`
            : `${overdueCount} ${overdueCount === 1 ? "contact needs" : "contacts need"} a nudge.`
        }
        supporting="Drag a contact across the board as your relationship moves. Tap to open and log a call, send an email, or set a follow-up reminder."
        actions={
          <>
            <div className="inline-flex bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-0.5">
              <ToggleBtn
                active={view === "kanban"}
                onClick={() => setView("kanban")}
                label="Board"
                icon={<KanbanSquare size={14} strokeWidth={1.5} />}
              />
              <ToggleBtn
                active={view === "list"}
                onClick={() => setView("list")}
                label="List"
                icon={<List size={14} strokeWidth={1.5} />}
              />
            </div>
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus size={14} strokeWidth={2} /> New contact
            </Button>
          </>
        }
      />

      {contacts.length === 0 ? (
        <EmptyState
          variant="page"
          icon={Building2}
          italic="Your book of business."
          title="Add the firms you want sending you work."
          description="Most notaries start with three to five title companies. Add one and we'll track every email, every call, and tap you on the shoulder when it's time to circle back."
          action={
            <Button size="md" onClick={() => setOpen(true)}>
              <Plus size={14} strokeWidth={2} /> Add your first contact
            </Button>
          }
          secondary="Tip: start with anyone who's sent you a job in the last 90 days."
        />
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

