"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Building2, Clock, Mail, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  CONTACT_STAGES,
  daysSince,
  isOverdue,
  type Contact,
} from "@/lib/types/contact";

/**
 * Flat list view. Better than the kanban on small phones — every row is a
 * single-tap target and the columns scroll vertically.
 */
export function ContactList({ contacts }: { contacts: Contact[] }) {
  return (
    <ul className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)] overflow-hidden">
      {contacts.map((c, i) => {
        const stage = CONTACT_STAGES.find((s) => s.value === c.stage);
        const days = daysSince(c.last_contacted_at);
        const overdue = isOverdue(c);
        return (
          <motion.li
            key={c.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, delay: Math.min(i * 0.02, 0.18) }}
          >
            <Link
              href={`/pipeline/${c.id}`}
              className="block px-4 sm:px-5 py-4 transition-colors hover:bg-[var(--surface-2)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[15px] font-medium text-[var(--text)] truncate inline-flex items-center gap-1.5">
                      <Building2
                        size={13}
                        strokeWidth={1.75}
                        className="text-[var(--text-subtle)]"
                      />
                      {c.company_name}
                    </p>
                    <Badge tone="neutral">{stage?.label ?? c.stage}</Badge>
                    {overdue && (
                      <Badge tone="warning">
                        <Clock size={10} strokeWidth={2} /> Nudge
                      </Badge>
                    )}
                  </div>
                  {c.contact_name && (
                    <p className="text-xs text-[var(--text-muted)] mt-1 truncate">
                      {c.contact_name}
                      {c.contact_role ? ` · ${c.contact_role}` : ""}
                    </p>
                  )}
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-subtle)]">
                    {c.email && (
                      <span className="inline-flex items-center gap-1 truncate max-w-[30ch]">
                        <Mail size={12} strokeWidth={1.75} /> {c.email}
                      </span>
                    )}
                    {c.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone size={12} strokeWidth={1.75} /> {c.phone}
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[11px] text-[var(--text-subtle)] font-mono uppercase tracking-wider">
                    Last
                  </p>
                  <p className="text-sm text-[var(--text)]">
                    {days === null
                      ? "Never"
                      : days === 0
                      ? "Today"
                      : `${days}d`}
                  </p>
                </div>
              </div>
            </Link>
          </motion.li>
        );
      })}
    </ul>
  );
}
