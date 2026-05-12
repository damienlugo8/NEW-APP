"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { Building2, Clock, Mail, Phone } from "lucide-react";
import { daysSince, isOverdue, type Contact } from "@/lib/types/contact";
import { cn } from "@/lib/utils";

/**
 * One contact in the kanban. Draggable from anywhere on the card. The "open"
 * affordance is a real Link nested inside — clicking it doesn't trigger drag
 * because we use a pointer activation distance below in the parent kanban.
 */
export function ContactCard({ contact, isOverlay }: { contact: Contact; isOverlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: contact.id, data: { contact } });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const days = daysSince(contact.last_contacted_at);
  const overdue = isOverdue(contact);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "group relative rounded-[var(--radius)] border bg-[var(--surface)] p-3.5 cursor-grab active:cursor-grabbing select-none",
        "transition-shadow duration-150 hover:shadow-[var(--shadow-sm)]",
        isDragging ? "opacity-30 border-[var(--border)]" : "border-[var(--border)]",
        isOverlay && "shadow-[var(--shadow-md)] border-[var(--accent)]"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--text)] truncate flex items-center gap-1.5">
            <Building2 size={12} strokeWidth={1.75} className="text-[var(--text-subtle)]" />
            {contact.company_name}
          </p>
          {contact.contact_name && (
            <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
              {contact.contact_name}
              {contact.contact_role ? ` · ${contact.contact_role}` : ""}
            </p>
          )}
        </div>
        {overdue && (
          <span className="shrink-0 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-mono text-[var(--warning)]">
            <Clock size={10} strokeWidth={2} /> nudge
          </span>
        )}
      </div>

      <div className="mt-2.5 flex items-center gap-3 text-[11px] text-[var(--text-subtle)]">
        {contact.email && (
          <span className="inline-flex items-center gap-1 truncate max-w-[18ch]">
            <Mail size={11} strokeWidth={1.75} /> {contact.email}
          </span>
        )}
        {contact.phone && (
          <span className="inline-flex items-center gap-1">
            <Phone size={11} strokeWidth={1.75} /> {contact.phone}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-[11px] text-[var(--text-subtle)]">
          {days === null
            ? "Never contacted"
            : days === 0
            ? "Today"
            : `${days}d ago`}
        </span>
        {/* Stop drag propagation so the link is actually clickable. */}
        <Link
          href={`/pipeline/${contact.id}`}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="text-[11px] font-medium text-[var(--accent)] hover:underline"
        >
          Open →
        </Link>
      </div>
    </div>
  );
}
