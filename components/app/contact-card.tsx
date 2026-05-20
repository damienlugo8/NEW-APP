"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { Building2, Mail, Phone } from "lucide-react";
import {
  daysSince,
  overdueSeverity,
  type Contact,
  type OverdueSeverity,
} from "@/lib/types/contact";
import { cn } from "@/lib/utils";

/**
 * One contact in the kanban. Draggable from anywhere on the card. The
 * "Open" link inside stops drag propagation so taps land where intended.
 *
 * The card leads with a severity dot (calm/warn/hot) computed from stage
 * and last-touch date — same idiom as the dashboard follow-up rows so
 * scanning the whole pipeline becomes a glance, not a read.
 */

const SEVERITY_DOT: Record<OverdueSeverity, string> = {
  calm: "bg-[var(--text-subtle)]",
  warn: "bg-[var(--warning)]",
  hot: "bg-[var(--danger)] ring-[3px] ring-[color-mix(in_oklab,var(--danger)_16%,transparent)]",
};

const SEVERITY_LABEL: Record<OverdueSeverity, string> = {
  calm: "On track",
  warn: "Getting cold",
  hot: "At risk",
};

export function ContactCard({ contact, isOverlay }: { contact: Contact; isOverlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: contact.id, data: { contact } });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const days = daysSince(contact.last_contacted_at);
  const sev = overdueSeverity(contact);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "group relative rounded-[var(--radius)] border bg-[var(--surface)] p-3.5 cursor-grab active:cursor-grabbing select-none",
        "transition-[box-shadow,border-color,transform] duration-150",
        "hover:shadow-[var(--shadow-md)] hover:border-[var(--border-strong)] hover:-translate-y-px",
        isDragging ? "opacity-30 border-[var(--border)]" : "border-[var(--border)]",
        isOverlay && "shadow-[var(--shadow-md)] border-[var(--accent)] rotate-1"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex items-start gap-2">
          <span
            className={cn("shrink-0 mt-1.5 h-2 w-2 rounded-full", SEVERITY_DOT[sev])}
            aria-label={SEVERITY_LABEL[sev]}
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--text)] truncate inline-flex items-center gap-1.5">
              <Building2 size={12} strokeWidth={1.5} className="text-[var(--text-subtle)]" />
              {contact.company_name}
            </p>
            {contact.contact_name && (
              <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                {contact.contact_name}
                {contact.contact_role ? ` · ${contact.contact_role}` : ""}
              </p>
            )}
          </div>
        </div>
      </div>

      {(contact.email || contact.phone) && (
        <div className="mt-2.5 flex items-center gap-3 text-[11px] text-[var(--text-subtle)]">
          {contact.email && (
            <span className="inline-flex items-center gap-1 truncate max-w-[18ch]">
              <Mail size={11} strokeWidth={1.5} /> {contact.email}
            </span>
          )}
          {contact.phone && (
            <span className="inline-flex items-center gap-1">
              <Phone size={11} strokeWidth={1.5} /> {contact.phone}
            </span>
          )}
        </div>
      )}

      <div className="mt-3 pt-2.5 border-t border-[var(--border-soft)] flex items-center justify-between">
        <span className="text-[11px] text-[var(--text-subtle)] t-num">
          {days === null
            ? "Never contacted"
            : days === 0
            ? "Touched today"
            : `${days}d ago`}
        </span>
        {/* Stop drag propagation so the link is actually clickable. */}
        <Link
          href={`/pipeline/${contact.id}`}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="text-[11px] font-medium text-[var(--accent)] hover:underline underline-offset-4"
        >
          Open →
        </Link>
      </div>
    </div>
  );
}
