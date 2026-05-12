"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  Mail,
  MapPin,
  Pencil,
  Phone,
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ContactForm } from "@/components/app/contact-form";
import { ActivityLog } from "@/components/app/activity-log";
import { EmailTemplates } from "@/components/app/email-templates";
import {
  CONTACT_STAGES,
  daysSince,
  isOverdue,
  type Contact,
  type ContactActivity,
} from "@/lib/types/contact";

export function ContactDetail({
  contact,
  activities,
}: {
  contact: Contact;
  activities: ContactActivity[];
}) {
  const [editing, setEditing] = useState(false);
  const stage = CONTACT_STAGES.find((s) => s.value === contact.stage);
  const overdue = isOverdue(contact);
  const days = daysSince(contact.last_contacted_at);

  return (
    <div className="mx-auto max-w-[920px] px-5 lg:px-8 py-8 pb-24 lg:pb-12">
      <Link
        href="/pipeline"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors mb-6"
      >
        <ArrowLeft size={14} strokeWidth={1.75} /> Pipeline
      </Link>

      <header className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge tone="accent">{stage?.label ?? contact.stage}</Badge>
            {overdue && (
              <Badge tone="warning">
                <Clock size={10} strokeWidth={2} /> Needs a nudge
              </Badge>
            )}
          </div>
          <h1 className="t-h1 flex items-center gap-3">
            <Building2 size={22} strokeWidth={1.5} className="text-[var(--text-subtle)]" />
            {contact.company_name}
          </h1>
          {contact.contact_name && (
            <p className="t-body text-[var(--text-muted)] mt-1">
              {contact.contact_name}
              {contact.contact_role ? ` · ${contact.contact_role}` : ""}
            </p>
          )}
        </div>
        <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
          <Pencil size={14} strokeWidth={1.75} /> Edit
        </Button>
      </header>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
        <div className="flex flex-col gap-6">
          <EmailTemplates contact={contact} />
          <ActivityLog contactId={contact.id} activities={activities} />
        </div>

        <aside className="flex flex-col gap-6">
          <motion.section
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 flex flex-col gap-3"
          >
            <p className="t-caption text-[var(--text-subtle)]">Details</p>
            <DetailRow
              icon={<Mail size={14} strokeWidth={1.75} />}
              label="Email"
              value={contact.email}
              href={contact.email ? `mailto:${contact.email}` : undefined}
            />
            <DetailRow
              icon={<Phone size={14} strokeWidth={1.75} />}
              label="Phone"
              value={contact.phone}
              href={contact.phone ? `tel:${contact.phone}` : undefined}
            />
            <DetailRow
              icon={<MapPin size={14} strokeWidth={1.75} />}
              label="Address"
              value={contact.address}
            />
            <DetailRow
              icon={<Calendar size={14} strokeWidth={1.75} />}
              label="Last contact"
              value={
                days === null
                  ? "Never"
                  : days === 0
                  ? "Today"
                  : `${days} day${days === 1 ? "" : "s"} ago`
              }
            />
            <DetailRow
              icon={<Calendar size={14} strokeWidth={1.75} />}
              label="Next follow-up"
              value={
                contact.next_followup_at
                  ? format(new Date(contact.next_followup_at), "MMM d, yyyy")
                  : null
              }
            />
          </motion.section>

          {contact.notes && (
            <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5">
              <p className="t-caption text-[var(--text-subtle)] mb-2">Notes</p>
              <p className="text-sm text-[var(--text)] whitespace-pre-wrap">
                {contact.notes}
              </p>
            </section>
          )}
        </aside>
      </div>

      <ContactForm
        open={editing}
        onClose={() => setEditing(false)}
        editing={contact}
      />
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
  href?: string;
}) {
  if (!value) {
    return (
      <div className="flex items-center gap-3 text-sm text-[var(--text-subtle)]">
        <span className="h-7 w-7 rounded-[6px] bg-[var(--surface-2)] inline-flex items-center justify-center">
          {icon}
        </span>
        <div>
          <p className="t-caption">{label}</p>
          <p className="text-xs">—</p>
        </div>
      </div>
    );
  }
  const content = (
    <div className="flex items-center gap-3 text-sm">
      <span className="h-7 w-7 rounded-[6px] bg-[var(--accent-soft)] text-[var(--accent)] inline-flex items-center justify-center">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="t-caption text-[var(--text-subtle)]">{label}</p>
        <p className="text-[var(--text)] truncate">{value}</p>
      </div>
    </div>
  );
  if (href) {
    return (
      <a href={href} className="hover:opacity-80 transition-opacity">
        {content}
      </a>
    );
  }
  return content;
}
