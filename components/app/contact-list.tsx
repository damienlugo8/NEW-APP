"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Building2, Mail, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  CONTACT_STAGES,
  daysSince,
  overdueSeverity,
  type Contact,
  type OverdueSeverity,
} from "@/lib/types/contact";
import { cn } from "@/lib/utils";

/**
 * Flat list view. Better than the kanban on small phones — every row is a
 * single-tap target and the columns scroll vertically. Each row leads with
 * a severity dot (calm/warn/hot) so a notary can scan and triage without
 * reading every field.
 */

const SEVERITY_DOT: Record<OverdueSeverity, string> = {
  calm: "bg-[var(--text-subtle)]",
  warn: "bg-[var(--warning)]",
  hot: "bg-[var(--danger)] ring-4 ring-[color-mix(in_oklab,var(--danger)_16%,transparent)]",
};

const SEVERITY_LABEL: Record<OverdueSeverity, string> = {
  calm: "On track",
  warn: "Getting cold",
  hot: "At risk",
};

export function ContactList({ contacts }: { contacts: Contact[] }) {
  return (
    <ul className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border-soft)] overflow-hidden shadow-[var(--shadow-sm)]">
      {contacts.map((c, i) => {
        const stage = CONTACT_STAGES.find((s) => s.value === c.stage);
        const days = daysSince(c.last_contacted_at);
        const sev = overdueSeverity(c);
        return (
          <motion.li
            key={c.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, delay: Math.min(i * 0.02, 0.18) }}
          >
            <Link
              href={`/pipeline/${c.id}`}
              className="group block px-4 sm:px-5 py-4 transition-colors hover:bg-[var(--surface-2)]"
            >
              <div className="flex items-start gap-4">
                <span
                  className={cn(
                    "shrink-0 mt-2 h-2.5 w-2.5 rounded-full",
                    SEVERITY_DOT[sev]
                  )}
                  aria-label={SEVERITY_LABEL[sev]}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[15px] font-medium text-[var(--text)] truncate inline-flex items-center gap-1.5">
                      <Building2
                        size={13}
                        strokeWidth={1.5}
                        className="text-[var(--text-subtle)]"
                      />
                      {c.company_name}
                    </p>
                    <Badge tone="neutral">{stage?.label ?? c.stage}</Badge>
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
                        <Mail size={12} strokeWidth={1.5} /> {c.email}
                      </span>
                    )}
                    {c.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone size={12} strokeWidth={1.5} /> {c.phone}
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[10px] text-[var(--text-subtle)] uppercase tracking-wider t-num-mono">
                    Last touch
                  </p>
                  <p className="text-sm text-[var(--text)] t-num mt-0.5">
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
