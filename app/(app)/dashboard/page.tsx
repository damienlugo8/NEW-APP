import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  KanbanSquare,
  Plus,
  Banknote,
  Building2,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkline } from "@/components/ui/sparkline";
import { SectionCard } from "@/components/app/section-card";
import { Stat } from "@/components/app/stat";
import { EmptyState } from "@/components/app/empty-state";
import {
  appointmentLocationLine,
  appointmentTitle,
  type Appointment,
} from "@/lib/types/appointment";
import {
  appointmentSummary,
  listTodaysAppointments,
} from "@/lib/db/queries/appointments";
import { countJournalEntries } from "@/lib/db/queries/journal";
import { listOverdueContacts } from "@/lib/db/queries/contacts";
import {
  type Contact,
  daysSince,
  overdueSeverity,
  type OverdueSeverity,
} from "@/lib/types/contact";
import {
  dailyEarningsLast30,
  monthOverMonthDelta,
} from "@/lib/db/queries/earnings";
import { getProfile } from "@/lib/auth/session";
import { usdCents, cn } from "@/lib/utils";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * Synthesize today into one human sentence. Scannable on a phone in 2s.
 *
 *   - 0 today + overdue: nudges toward the pipeline
 *   - 0 today + clean:   permission to breathe
 *   - 1 today:           who + when
 *   - 2+ today:          count, first time, last time, expected take
 */
function dayLine(appointments: Appointment[], overdueCount: number): string {
  if (appointments.length === 0) {
    if (overdueCount > 0) {
      return overdueCount === 1
        ? "Calendar's clear today. One contact is waiting on a nudge from you."
        : `Calendar's clear today. ${overdueCount} contacts are waiting on a nudge from you.`;
    }
    return "Calendar's clear and nobody's overdue. Good day to chase one new title company.";
  }

  if (appointments.length === 1) {
    const a = appointments[0];
    const when = format(new Date(a.scheduled_at), "h:mm a").toLowerCase();
    const who = a.client_name ?? appointmentTitle(a);
    return `One signing today — ${who} at ${when}.`;
  }

  const first = format(new Date(appointments[0].scheduled_at), "h:mm a").toLowerCase();
  const last = format(
    new Date(appointments[appointments.length - 1].scheduled_at),
    "h:mm a"
  ).toLowerCase();
  const expectedCents = appointments.reduce((sum, a) => sum + (a.fee_cents ?? 0), 0);
  const tail =
    expectedCents > 0
      ? ` Expected take: ${usdCents(expectedCents)}.`
      : "";
  return `${appointments.length} signings today — first at ${first}, last at ${last}.${tail}`;
}

export default async function DashboardPage() {
  const [today, summary, journalCount, overdue, profile, daily, mom] = await Promise.all([
    listTodaysAppointments(),
    appointmentSummary(),
    countJournalEntries(),
    listOverdueContacts(4),
    getProfile(),
    dailyEarningsLast30(),
    monthOverMonthDelta(),
  ]);

  const firstName = profile?.full_legal_name?.split(/\s+/)[0] ?? "";
  const isBrandNew =
    today.length === 0 &&
    overdue.length === 0 &&
    summary.weekCount === 0 &&
    journalCount === 0 &&
    summary.monthRevenueCents === 0;

  // First-run state gets its own moment — not a wall of empty cards.
  if (isBrandNew) {
    return (
      <div className="mx-auto max-w-[1080px] px-5 lg:px-8 py-10 pb-24 lg:pb-12">
        <header className="mb-10">
          <p className="t-caption text-[var(--text-subtle)] mb-3">
            {format(new Date(), "EEEE, MMM d")}
          </p>
          <h1 className="t-greeting">
            <span className="font-serif italic text-[var(--text-muted)]">{greeting()},</span>{" "}
            {firstName || "welcome"}.
          </h1>
        </header>
        <EmptyState
          variant="page"
          icon={Sparkles}
          italic="A blank page."
          title="Let's put your first signing on it."
          description="Add a signing and your day, your earnings, and your journal entry all start from the same spot. Two minutes and you'll never lose track of a job again."
          action={
            <Link href="/appointments">
              <Button size="md">
                <Plus size={14} strokeWidth={2} />
                Add your first signing
              </Button>
            </Link>
          }
          secondary={
            <Link href="/pipeline" className="hover:text-[var(--text)] transition-colors">
              or add a title company you want to work with →
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] px-5 lg:px-8 py-8 pb-24 lg:pb-12">
      <header className="mb-8">
        <p className="t-caption text-[var(--text-subtle)] mb-3">
          {format(new Date(), "EEEE, MMM d")}
        </p>
        <h1 className="t-greeting">
          <span className="font-serif italic text-[var(--text-muted)]">{greeting()},</span>{" "}
          {firstName ? `${firstName}.` : "there."}
        </h1>
        <p className="t-body text-[var(--text-muted)] mt-3 max-w-[64ch]">
          {dayLine(today, overdue.length)}
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* HERO: Today */}
        <div className="lg:col-span-2">
          <TodayHero appointments={today} />
        </div>

        {/* PRIMARY METRIC: Earnings */}
        <EarningsCard
          monthRevenueCents={summary.monthRevenueCents}
          daily={daily}
          mom={mom}
        />

        {/* SECONDARY METRICS */}
        <Stat
          eyebrow="This week"
          value={summary.weekCount}
          helper={
            summary.weekCount === 0
              ? "Nothing booked Sun–Sat."
              : `${summary.weekCount === 1 ? "signing" : "signings"} Sun–Sat.`
          }
          icon={CalendarDays}
          href="/appointments"
        />
        <Stat
          eyebrow="Journal"
          value={journalCount}
          helper={
            journalCount === 0
              ? "Lock your first entry."
              : "Locked entries, searchable forever."
          }
          icon={BookOpen}
          href="/journal"
        />
        <QuickActionsCard />

        {/* FOLLOW-UPS — span 2 on desktop, full width below the metrics */}
        <div className="lg:col-span-3">
          <FollowUpsCard contacts={overdue} />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────── */

function TodayHero({ appointments }: { appointments: Appointment[] }) {
  return (
    <SectionCard
      tone="hero"
      eyebrow="Today"
      title="On the calendar"
      link={{ href: "/appointments", label: "All signings" }}
      bodyClassName="px-0 pb-0"
    >
      {appointments.length === 0 ? (
        <div className="px-6 pb-8">
          <EmptyState
            icon={CalendarDays}
            title="No signings on the books today."
            description="Add one and the address, fee, and a one-tap nav link land right here."
            action={
              <Link href="/appointments">
                <Button size="sm">
                  <Plus size={13} strokeWidth={2} /> Add a signing
                </Button>
              </Link>
            }
          />
        </div>
      ) : (
        <ol className="relative">
          {appointments.map((a, i) => {
            const when = format(new Date(a.scheduled_at), "h:mm a").toLowerCase();
            const isLast = i === appointments.length - 1;
            return (
              <li
                key={a.id}
                className={cn(
                  "relative px-6 py-4 flex items-center gap-5",
                  !isLast && "border-b border-[var(--border-soft)]"
                )}
              >
                {/* timeline rail */}
                <div className="shrink-0 w-[68px] flex flex-col items-end">
                  <span className="t-num text-sm text-[var(--text)] font-medium">
                    {when}
                  </span>
                  {a.duration_min ? (
                    <span className="text-[10px] text-[var(--text-subtle)] mt-0.5">
                      {a.duration_min}m
                    </span>
                  ) : null}
                </div>
                <span
                  className={cn(
                    "shrink-0 h-2.5 w-2.5 rounded-full",
                    a.status === "completed"
                      ? "bg-[var(--success)]"
                      : "bg-[var(--accent)] ring-4 ring-[color-mix(in_oklab,var(--accent)_18%,transparent)]"
                  )}
                  aria-hidden
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text)] truncate">
                    {appointmentTitle(a)}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                    {appointmentLocationLine(a) || "Location TBD"}
                  </p>
                </div>
                <div className="shrink-0">
                  {a.status === "completed" ? (
                    <Badge tone="success">Done</Badge>
                  ) : a.fee_cents > 0 ? (
                    <span className="t-num text-sm text-[var(--text)] font-medium">
                      {usdCents(a.fee_cents)}
                    </span>
                  ) : (
                    <Badge tone="accent">Scheduled</Badge>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </SectionCard>
  );
}

/* ─────────────────────────────────────────────── */

function EarningsCard({
  monthRevenueCents,
  daily,
  mom,
}: {
  monthRevenueCents: number;
  daily: number[];
  mom: { thisMonthCents: number; lastMonthCents: number; percent: number | null };
}) {
  const monthLabel = format(new Date(), "MMM");
  const hasData = monthRevenueCents > 0 || daily.some((d) => d > 0);

  return (
    <Link
      href="/appointments"
      className="group block rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden transition-colors hover:border-[var(--border-strong)]"
    >
      <div className="p-5 pb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="t-caption text-[var(--text-subtle)]">{monthLabel} earnings</p>
          <p className="t-num-display text-[var(--text)] mt-2">
            {hasData ? usdCents(monthRevenueCents) : "$0"}
          </p>
        </div>
        <span
          className="h-9 w-9 rounded-[var(--radius)] inline-flex items-center justify-center bg-[var(--accent-soft)] text-[var(--accent)] shrink-0"
          aria-hidden
        >
          <Banknote size={15} strokeWidth={1.5} />
        </span>
      </div>

      <div className="px-5 pb-2">
        <Sparkline data={daily} height={48} className="w-full" />
      </div>

      <div className="px-5 pb-5 pt-1 flex items-center justify-between gap-3">
        <p className="text-xs text-[var(--text-subtle)]">
          {hasData ? "Last 30 days" : "Mark a signing complete to track it"}
        </p>
        {mom.percent !== null ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[var(--radius-sm)] text-[11px] font-medium t-num",
              mom.percent > 0 &&
                "text-[var(--success)] bg-[color-mix(in_oklab,var(--success)_14%,transparent)]",
              mom.percent < 0 &&
                "text-[var(--danger)] bg-[color-mix(in_oklab,var(--danger)_14%,transparent)]",
              mom.percent === 0 && "text-[var(--text-subtle)] bg-[var(--surface-2)]"
            )}
          >
            {mom.percent > 0 ? "+" : ""}
            {mom.percent}% vs last
          </span>
        ) : null}
      </div>
    </Link>
  );
}

/* ─────────────────────────────────────────────── */

const SEVERITY_DOT: Record<OverdueSeverity, string> = {
  calm: "bg-[var(--text-subtle)]",
  warn: "bg-[var(--warning)]",
  hot: "bg-[var(--danger)] ring-4 ring-[color-mix(in_oklab,var(--danger)_18%,transparent)]",
};

const SEVERITY_LABEL: Record<OverdueSeverity, string> = {
  calm: "On track",
  warn: "Getting cold",
  hot: "At risk",
};

function FollowUpsCard({ contacts }: { contacts: Contact[] }) {
  return (
    <SectionCard
      eyebrow="Pipeline"
      title="Who to follow up with"
      link={{ href: "/pipeline", label: "All contacts" }}
      bodyClassName="px-0 pb-0"
    >
      {contacts.length === 0 ? (
        <div className="px-6 pb-8">
          <EmptyState
            icon={KanbanSquare}
            title="Nobody's overdue right now."
            description="When a contact goes cold past its stage window, they'll show up here so you can hit reply before they forget you exist."
            action={
              <Link href="/pipeline">
                <Button size="sm" variant="ghost">
                  <Plus size={13} strokeWidth={2} /> Add a contact
                </Button>
              </Link>
            }
          />
        </div>
      ) : (
        <ul className="divide-y divide-[var(--border-soft)]">
          {contacts.map((c) => {
            const days = daysSince(c.last_contacted_at);
            const sev = overdueSeverity(c);
            return (
              <li key={c.id}>
                <Link
                  href={`/pipeline/${c.id}`}
                  className="px-6 py-4 flex items-center gap-4 hover:bg-[var(--surface-2)] transition-colors"
                >
                  <span
                    className={cn("shrink-0 h-2.5 w-2.5 rounded-full", SEVERITY_DOT[sev])}
                    aria-label={SEVERITY_LABEL[sev]}
                  />
                  <span className="shrink-0 h-9 w-9 rounded-[10px] bg-[var(--accent-soft)] text-[var(--accent)] inline-flex items-center justify-center">
                    <Building2 size={14} strokeWidth={1.5} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text)] truncate">
                      {c.company_name}
                    </p>
                    <p className="text-xs text-[var(--text-subtle)] truncate mt-0.5">
                      {days === null
                        ? "Never contacted"
                        : `${days}d since last touch · ${SEVERITY_LABEL[sev]}`}
                    </p>
                  </div>
                  <span className="text-[var(--text-subtle)] group-hover:text-[var(--text-muted)]">
                    <ArrowRight size={14} strokeWidth={1.5} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}

/* ─────────────────────────────────────────────── */

function QuickActionsCard() {
  const actions = [
    { href: "/appointments", icon: CalendarDays, label: "New signing" },
    { href: "/journal/new", icon: BookOpen, label: "New journal entry" },
    { href: "/pipeline", icon: KanbanSquare, label: "Add a contact" },
  ];
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 flex flex-col">
      <p className="t-caption text-[var(--text-subtle)] mb-4">Quick add</p>
      <ul className="flex flex-col gap-2 mt-auto">
        {actions.map((a) => (
          <li key={a.href}>
            <Link
              href={a.href}
              className="group flex items-center gap-3 px-3 h-10 rounded-[var(--radius)] border border-[var(--border-soft)] bg-[var(--bg)] hover:border-[var(--accent)] hover:bg-[var(--surface-2)] transition-colors"
            >
              <a.icon
                size={14}
                strokeWidth={1.5}
                className="text-[var(--accent)] shrink-0"
              />
              <span className="text-sm text-[var(--text)] truncate">{a.label}</span>
              <ArrowRight
                size={13}
                strokeWidth={1.5}
                className="text-[var(--text-subtle)] ml-auto group-hover:text-[var(--text-muted)] group-hover:translate-x-0.5 transition-all"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
