"use client";

import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { ContactCard } from "./contact-card";
import type { Contact, ContactStage } from "@/lib/types/contact";
import { cn } from "@/lib/utils";

export function KanbanColumn({
  stage,
  label,
  contacts,
  onAdd,
  description,
}: {
  stage: ContactStage;
  label: string;
  contacts: Contact[];
  onAdd: (stage: ContactStage) => void;
  description?: string;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: stage });

  return (
    <div className="flex flex-col w-[280px] sm:w-[300px] shrink-0">
      <div className="px-1.5 mb-2 flex items-center justify-between">
        <div>
          <p className="t-caption text-[var(--text-muted)]">
            {label} · {contacts.length}
          </p>
          {description && (
            <p className="text-[11px] text-[var(--text-subtle)] mt-0.5 max-w-[26ch]">
              {description}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onAdd(stage)}
          className="h-7 w-7 rounded-[6px] inline-flex items-center justify-center text-[var(--text-subtle)] hover:text-[var(--text)] hover:bg-[var(--surface)]"
          aria-label={`Add to ${label}`}
        >
          <Plus size={14} strokeWidth={1.75} />
        </button>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "rounded-[var(--radius-lg)] border bg-[var(--surface-2)] p-2.5 flex flex-col gap-2 min-h-[260px]",
          isOver
            ? "border-[var(--accent)] bg-[var(--accent-soft)]"
            : "border-[var(--border)]"
        )}
      >
        {contacts.map((c) => (
          <ContactCard key={c.id} contact={c} />
        ))}
        {contacts.length === 0 && (
          <div className="flex-1 flex items-center justify-center min-h-[120px] text-[11px] text-[var(--text-subtle)] text-center px-3">
            Drop a contact here
            <br />
            or tap + to add one
          </div>
        )}
      </div>
    </div>
  );
}
