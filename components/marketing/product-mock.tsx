"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CalendarDays, MapPin, ArrowUpRight, Phone, Mail, Building2 } from "lucide-react";

/**
 * Hand-built mock of the NotaryFlow app — a kanban view of the sales pipeline
 * (the differentiator) plus today's signings card. Designed to look like a
 * real product, not a stock screenshot. Animates in column-by-column.
 */
export function ProductMock() {
  const reduce = useReducedMotion();
  const ease = [0.22, 1, 0.36, 1] as const;

  return (
    <div className="relative">
      {/* Ambient frame — soft accent wash behind the mock, no orbs. */}
      <div
        aria-hidden
        className="absolute -inset-x-8 -inset-y-12 -z-10 rounded-[28px]
                   bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--accent)_10%,transparent),transparent_60%)]"
      />

      <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-md)] overflow-hidden">
        {/* Window chrome */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface-2)]">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--border-strong)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--border-strong)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--border-strong)]" />
          </div>
          <div className="font-mono text-[11px] text-[var(--text-subtle)] tracking-wider uppercase">
            notaryflow.app / pipeline
          </div>
          <div className="w-12" />
        </div>

        {/* App body */}
        <div className="grid md:grid-cols-[200px_1fr] min-h-[460px]">
          {/* Sidebar */}
          <div className="hidden md:flex flex-col gap-1 p-3 border-r border-[var(--border)] bg-[color-mix(in_oklab,var(--bg)_60%,transparent)]">
            <SidebarItem label="Dashboard" />
            <SidebarItem label="Calendar" />
            <SidebarItem label="Journal" />
            <SidebarItem label="Pipeline" active />
            <SidebarItem label="Clients" />
            <SidebarItem label="Invoices" />
            <SidebarItem label="Mileage" />
            <div className="mt-auto px-2 pt-3 border-t border-[var(--border)] text-[11px] text-[var(--text-subtle)] font-mono uppercase tracking-wider">
              Bergen County, NJ
            </div>
          </div>

          {/* Content */}
          <div className="p-5 md:p-6">
            <div className="flex items-end justify-between mb-5">
              <div>
                <p className="t-caption text-[var(--text-subtle)] mb-1">Pipeline</p>
                <h4 className="text-[20px] font-medium tracking-tight">Outreach this quarter</h4>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                  $14.2k pipeline value
                </span>
              </div>
            </div>

            <motion.div
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: reduce ? 0 : 0.08, delayChildren: 0.15 } },
              }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3"
            >
              <Column title="Prospect" count={6}>
                <DealCard
                  company="Stewart Title — Paramus"
                  contact="Marisa Quinn"
                  value="$1,800"
                  last="No contact yet"
                />
                <DealCard
                  company="Hudson Closing Services"
                  contact="Dev Patel"
                  value="$2,400"
                  last="2 weeks ago"
                />
              </Column>
              <Column title="Contacted" count={4}>
                <DealCard
                  company="First American Title"
                  contact="Lila Brennan"
                  value="$3,200"
                  last="3 days ago"
                  tone="warning"
                />
                <DealCard
                  company="Coastal Signing Co."
                  contact="Aaron Lee"
                  value="$1,200"
                  last="Yesterday"
                  tone="warning"
                />
              </Column>
              <Column title="Engaged" count={3}>
                <DealCard
                  company="Bergen Law Group"
                  contact="Hannah Reyes"
                  value="$4,500"
                  last="Demo Tue 2:30"
                  tone="accent"
                />
              </Column>
              <Column title="Active" count={5}>
                <DealCard
                  company="Snapdocs (vendor)"
                  contact="Ops team"
                  value="—"
                  last="3 signings this wk"
                  tone="success"
                />
              </Column>
            </motion.div>

            {/* Today strip */}
            <motion.div
              initial={{ opacity: 0, y: reduce ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease, delay: 0.45 }}
              className="mt-6 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-3 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-[8px] bg-[var(--accent-soft)] text-[var(--accent)] inline-flex items-center justify-center shrink-0">
                  <CalendarDays size={16} strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">Loan signing — 47 Ridge Rd, Mahwah NJ</p>
                  <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                    <MapPin size={12} strokeWidth={1.75} />
                    Today · 2:30 PM · $185 fee
                  </p>
                </div>
              </div>
              <span className="hidden sm:inline-flex font-mono text-[11px] uppercase tracking-wider text-[var(--text-subtle)]">
                Next →
              </span>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarItem({ label, active }: { label: string; active?: boolean }) {
  return (
    <div
      className={
        "px-3 py-1.5 rounded-[8px] text-sm transition-colors " +
        (active
          ? "bg-[var(--surface)] text-[var(--text)] border border-[var(--border)]"
          : "text-[var(--text-muted)]")
      }
    >
      {label}
    </div>
  );
}

function Column({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
      }}
      className="flex flex-col gap-2 min-w-0"
    >
      <div className="flex items-center justify-between text-xs px-1">
        <span className="font-medium text-[var(--text)]">{title}</span>
        <span className="font-mono text-[var(--text-subtle)]">{count}</span>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </motion.div>
  );
}

function DealCard({
  company,
  contact,
  value,
  last,
  tone = "neutral",
}: {
  company: string;
  contact: string;
  value: string;
  last: string;
  tone?: "neutral" | "warning" | "accent" | "success";
}) {
  const dot = {
    neutral: "bg-[var(--border-strong)]",
    warning: "bg-[var(--warning)]",
    accent:  "bg-[var(--accent)]",
    success: "bg-[var(--success)]",
  }[tone];
  return (
    <div className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-3 hover:border-[var(--border-strong)] transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Building2 size={13} strokeWidth={1.75} className="text-[var(--text-subtle)] shrink-0" />
          <p className="text-[13px] font-medium truncate">{company}</p>
        </div>
        <span className={"h-1.5 w-1.5 rounded-full mt-1.5 " + dot} />
      </div>
      <p className="text-[12px] text-[var(--text-muted)] mt-1 truncate">{contact}</p>
      <div className="mt-2 flex items-center justify-between text-[11px]">
        <span className="font-mono text-[var(--text)]">{value}</span>
        <span className="text-[var(--text-subtle)] truncate ml-2">{last}</span>
      </div>
    </div>
  );
}

/* These imports keep the file self-contained even if other icons aren't used elsewhere yet. */
void ArrowUpRight; void Phone; void Mail;
