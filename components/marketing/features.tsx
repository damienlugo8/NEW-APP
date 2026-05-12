"use client";

import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  BookOpen,
  Receipt,
  KanbanSquare,
  MapPin,
  Phone,
  Mail,
  Check,
} from "lucide-react";

/**
 * "Everything you actually need." Four feature blocks; each pairs plain-English
 * copy with a hand-built mockup. The pipeline block gets the most visual love
 * because it's the differentiator.
 */
export function Features() {
  return (
    <section id="features" className="py-24 md:py-32 border-t border-[var(--border)]">
      <div className="mx-auto max-w-[1200px] px-6 md:px-10">
        <Reveal>
          <p className="t-caption text-[var(--text-subtle)] mb-5">What it does</p>
          <h2 className="t-h2-serif max-w-[18ch]">
            Everything you <em>actually</em> need.
          </h2>
          <p className="t-body-lg text-[var(--text-muted)] mt-6 max-w-[58ch]">
            Four tools. One app. Built so a notary can run the whole business between
            appointments — without opening Calendar, Notes, Gmail, and a paper journal.
          </p>
        </Reveal>

        <div className="mt-16 space-y-20 md:space-y-28">
          <Reveal>
            <FeatureRow
              eyebrow="Appointments"
              title="Appointments that don't slip."
              body="Add a signing in fifteen seconds. We pre-fill the address, the fee, the document type. Today's appointments are pinned at the top of your dashboard with a one-tap nav link."
              bullets={[
                "Month / week / day views",
                "Map preview before you drive",
                "Auto-link to a journal entry when complete",
              ]}
              visual={<AppointmentsVisual />}
            />
          </Reveal>

          <Reveal>
            <FeatureRow
              eyebrow="Journal"
              reverse
              title="A digital journal your state will accept."
              body="Capture the signer's name, ID type, and signature on the touchscreen — right there in the car. Saved entries lock automatically, like a paper journal would."
              bullets={[
                "Signature capture on touchscreen",
                "Locked once saved (legally append-only)",
                "Print-ready PDF export for audits",
              ]}
              visual={<JournalVisual />}
            />
          </Reveal>

          <Reveal>
            <FeatureRow
              eyebrow="Invoices"
              title="Get paid faster."
              body="Send a polished invoice from your phone the minute you walk out the door. We track who's overdue and remind you before you forget."
              bullets={[
                "One-tap invoice from a completed signing",
                "Overdue surfacing on the dashboard",
                "Branded with your business name",
              ]}
              visual={<InvoicesVisual />}
            />
          </Reveal>

          {/* The differentiator. Larger, badged. */}
          <Reveal>
            <FeatureRow
              eyebrow={
                <span className="inline-flex items-center gap-2">
                  Sales pipeline
                  <Badge tone="accent">The differentiator</Badge>
                </span>
              }
              reverse
              title="A pipeline for getting more work."
              body="Every notary keeps a list of title companies, signing services, and law firms they're chasing. Most keep it in their head or a spreadsheet. We give you a real CRM — drag a contact across stages, log every call and email, and get nudged when it's time to follow up."
              bullets={[
                "Kanban board: Prospect → Contacted → Following up → Active",
                "Activity log per contact (calls, emails, notes)",
                "Smart reminders: \"You haven't talked to Premier Title in 23 days.\"",
                "Email templates: cold intro, two-week follow-up, quarterly check-in",
              ]}
              visual={<PipelineVisual />}
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ─── layout ──────────────────────────────────────────────────────────── */

function FeatureRow({
  eyebrow,
  title,
  body,
  bullets,
  visual,
  reverse,
}: {
  eyebrow: React.ReactNode;
  title: string;
  body: string;
  bullets: string[];
  visual: React.ReactNode;
  reverse?: boolean;
}) {
  return (
    <div className={"grid gap-10 md:gap-16 md:grid-cols-2 items-center " + (reverse ? "md:[&>*:first-child]:order-2" : "")}>
      <div>
        <p className="t-caption text-[var(--text-subtle)] mb-3">{eyebrow}</p>
        <h3 className="t-h2-serif max-w-[18ch]">{title}</h3>
        <p className="t-body-lg text-[var(--text-muted)] mt-5 max-w-[44ch]">{body}</p>
        <ul className="mt-6 flex flex-col gap-2.5">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2.5 text-sm">
              <Check size={15} className="text-[var(--accent)] mt-[2px] shrink-0" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>{visual}</div>
    </div>
  );
}

/* ─── visuals ─────────────────────────────────────────────────────────── */

function AppointmentsVisual() {
  return (
    <MockFrame label="appointments / today">
      <div className="p-5 grid gap-3">
        {[
          { time: "9:00 AM", client: "Maria Ortega",   doc: "Power of Attorney", loc: "Ridgewood, NJ", fee: "$135" },
          { time: "11:30 AM", client: "Premier Title", doc: "Loan signing",      loc: "Paramus, NJ",   fee: "$185" },
          { time: "2:30 PM", client: "47 Ridge Rd",    doc: "Loan signing",      loc: "Mahwah, NJ",    fee: "$165" },
        ].map((a, i) => (
          <div
            key={i}
            className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-3 flex items-center gap-3"
          >
            <div className="w-14 text-right">
              <p className="font-mono text-[11px] text-[var(--text-subtle)]">{a.time.split(" ")[0]}</p>
              <p className="font-mono text-[10px] text-[var(--text-subtle)]">{a.time.split(" ")[1]}</p>
            </div>
            <div className="h-8 w-px bg-[var(--border)]" />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium truncate">{a.doc} — {a.client}</p>
              <p className="text-[12px] text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5">
                <MapPin size={12} />
                {a.loc}
              </p>
            </div>
            <span className="font-mono text-[12px] text-[var(--text)]">{a.fee}</span>
          </div>
        ))}
      </div>
    </MockFrame>
  );
}

function JournalVisual() {
  return (
    <MockFrame label="journal / entry #248">
      <div className="p-5 grid gap-4">
        <div className="grid grid-cols-2 gap-3 text-[12px]">
          <Field label="Signer" value="Lila Brennan" />
          <Field label="ID" value="DL · NJ · ••3814" mono />
          <Field label="Document" value="Loan signing" />
          <Field label="Fee" value="$185" mono />
        </div>
        <div className="rounded-[var(--radius)] border border-dashed border-[var(--border-strong)] bg-[var(--bg)] p-3 h-20 flex items-end justify-end">
          <svg viewBox="0 0 200 60" className="h-12 w-full">
            <path
              d="M5 40 Q 25 5, 45 35 T 95 30 Q 115 50, 140 25 T 195 35"
              fill="none"
              stroke="var(--text)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="flex items-center justify-between">
          <span className="t-caption text-[var(--text-subtle)]">Locked · Apr 18, 2026</span>
          <Badge tone="success">Compliant</Badge>
        </div>
      </div>
    </MockFrame>
  );
}

function InvoicesVisual() {
  return (
    <MockFrame label="invoices">
      <div className="p-5 grid gap-2">
        {[
          { co: "Premier Title of Bergen County", amt: "$185", days: "Paid 2d ago",    tone: "success" as const },
          { co: "Stewart Title — Paramus",        amt: "$135", days: "Sent yesterday", tone: "neutral" as const },
          { co: "Hudson Closing Services",        amt: "$220", days: "12 days overdue", tone: "warning" as const },
        ].map((row) => (
          <div key={row.co} className="flex items-center justify-between rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-[13px] font-medium truncate">{row.co}</p>
              <p className="text-[11px] text-[var(--text-muted)]">{row.days}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[13px]">{row.amt}</span>
              <Badge tone={row.tone}>{row.tone === "success" ? "Paid" : row.tone === "warning" ? "Overdue" : "Sent"}</Badge>
            </div>
          </div>
        ))}
      </div>
    </MockFrame>
  );
}

function PipelineVisual() {
  return (
    <MockFrame label="pipeline / outreach">
      <div className="p-5">
        <div className="grid grid-cols-4 gap-2 mb-3 text-[10px] font-mono uppercase tracking-wider text-[var(--text-subtle)]">
          <span>Prospect</span>
          <span>Contacted</span>
          <span>Following up</span>
          <span>Active</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <Col cards={["Stewart Title", "Hudson Closing"]} dot="neutral" />
          <Col cards={["First American", "Coastal Signing"]} dot="warning" />
          <Col cards={["Bergen Law Group"]} dot="accent" highlight />
          <Col cards={["Premier Title", "Crossroads Title", "Snapdocs"]} dot="success" />
        </div>
        <div className="mt-4 rounded-[var(--radius)] border border-[var(--accent)] bg-[var(--accent-soft)] px-3 py-2.5 flex items-center gap-3">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] shrink-0" />
          <p className="text-[12px] text-[var(--text)] leading-snug">
            <span className="font-medium">Premier Title</span> — last contact 23 days ago. Send the
            quarterly check-in?
          </p>
          <span className="ml-auto font-mono text-[10px] text-[var(--accent)] uppercase tracking-wider">Nudge</span>
        </div>
      </div>
    </MockFrame>
  );
}

function Col({
  cards,
  dot,
  highlight,
}: {
  cards: string[];
  dot: "neutral" | "warning" | "accent" | "success";
  highlight?: boolean;
}) {
  const dotColor = {
    neutral: "bg-[var(--border-strong)]",
    warning: "bg-[var(--warning)]",
    accent:  "bg-[var(--accent)]",
    success: "bg-[var(--success)]",
  }[dot];
  return (
    <div className="flex flex-col gap-1.5">
      {cards.map((c) => (
        <div
          key={c}
          className={
            "rounded-[6px] border px-2 py-1.5 text-[11px] flex items-center gap-1.5 " +
            (highlight
              ? "border-[var(--accent)] bg-[var(--surface)]"
              : "border-[var(--border)] bg-[var(--surface)]")
          }
        >
          <span className={"h-1 w-1 rounded-full " + dotColor} />
          <span className="truncate">{c}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── primitives ──────────────────────────────────────────────────────── */

function MockFrame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-md)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--surface-2)]">
        <div className="flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[var(--border-strong)]" />
          <span className="h-2 w-2 rounded-full bg-[var(--border-strong)]" />
          <span className="h-2 w-2 rounded-full bg-[var(--border-strong)]" />
        </div>
        <span className="font-mono text-[10px] text-[var(--text-subtle)] uppercase tracking-wider">{label}</span>
        <span className="w-8" />
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-[6px] border border-[var(--border)] bg-[var(--bg)] px-2.5 py-2">
      <p className="t-caption text-[var(--text-subtle)] mb-0.5">{label}</p>
      <p className={"text-[12px] text-[var(--text)] " + (mono ? "font-mono" : "")}>{value}</p>
    </div>
  );
}

// Silence unused imports — kept for downstream use later.
void Phone;
void Mail;
void CalendarDays;
void BookOpen;
void Receipt;
void KanbanSquare;
