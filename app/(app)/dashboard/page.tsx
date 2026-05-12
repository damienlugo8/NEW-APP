import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  KanbanSquare,
  Plus,
  Banknote,
  Clock,
  Building2,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { type Contact, daysSince } from "@/lib/types/contact";
import { getProfile } from "@/lib/auth/session";
import { usdCents } from "@/lib/utils";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Late night";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const [today, summary, journalCount, overdue, profile] = await Promise.all([
    listTodaysAppointments(),
    appointmentSummary(),
    countJournalEntries(),
    listOverdueContacts(3),
    getProfile(),
  ]);

  const firstName = profile?.full_legal_name?.split(/\s+/)[0] ?? "";

  return (
    <div className="mx-auto max-w-[1280px] px-5 lg:px-8 py-8 pb-24 lg:pb-12">
      <header className="mb-10">
        <p className="t-caption text-[var(--text-subtle)] mb-2">
          {format(new Date(), "EEEE, MMM d")}
        </p>
        <h1 className="t-h1">
          {greeting()}{firstName ? `, ${firstName}` : ""}.
        </h1>
        <p className="t-body text-[var(--text-muted)] mt-2 max-w-[60ch]">
          {today.length === 0
            ? "Nothing on the calendar today. Good day to send a follow-up."
            : today.length === 1
            ? "One signing on the calendar today."
            : `${today.length} signings on the calendar today.`}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <TodayCard appointments={today} />
        <StatStack
          weekCount={summary.weekCount}
          monthRevenueCents={summary.monthRevenueCents}
          journalCount={journalCount}
        />
        <FollowUpsCard contacts={overdue} />
        <QuickActionsCard />
      </div>
    </div>
  );
}

function TodayCard({ appointments }: { appointments: Appointment[] }) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      <div className="px-6 py-5 border-b border-[var(--border)] flex items-center justify-between">
        <div>
          <p className="t-caption text-[var(--text-subtle)] mb-1">Today</p>
          <h2 className="t-h3">On the calendar</h2>
        </div>
        <Link href="/appointments">
          <Button size="sm" variant="ghost">
            All <ArrowRight size={13} strokeWidth={1.75} />
          </Button>
        </Link>
      </div>
      {appointments.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <CalendarDays size={22} strokeWidth={1.5} className="mx-auto text-[var(--text-subtle)]" />
          <p className="mt-3 text-sm text-[var(--text)]">No signings today.</p>
          <p className="mt-1 text-xs text-[var(--text-subtle)]">
            Add one and the address, fee, and a one-tap nav link land here.
          </p>
          <Link href="/appointments" className="inline-block mt-4">
            <Button size="sm">
              <Plus size={13} strokeWidth={2} /> Add a signing
            </Button>
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--border)]">
          {appointments.map((a) => (
            <li key={a.id} className="px-6 py-4 flex items-center gap-4">
              <div className="shrink-0 font-mono text-sm text-[var(--text)] w-[58px] tabular-nums">
                {format(new Date(a.scheduled_at), "h:mm a").toLowerCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {appointmentTitle(a)}
                </p>
                <p className="text-xs text-[var(--text-muted)] truncate">
                  {appointmentLocationLine(a) || "—"}
                </p>
              </div>
              <div className="shrink-0">
                {a.status === "completed" ? (
                  <Badge tone="success">Done</Badge>
                ) : a.fee_cents > 0 ? (
                  <span className="text-sm font-mono text-[var(--text)]">
                    {usdCents(a.fee_cents)}
                  </span>
                ) : (
                  <Badge tone="accent">Scheduled</Badge>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function StatStack({
  weekCount,
  monthRevenueCents,
  journalCount,
}: {
  weekCount: number;
  monthRevenueCents: number;
  journalCount: number;
}) {
  return (
    <section className="flex flex-col gap-4">
      <StatCard
        eyebrow="This month"
        label="Earned"
        value={monthRevenueCents > 0 ? usdCents(monthRevenueCents) : "$0"}
        icon={<Banknote size={15} strokeWidth={1.75} />}
        helper={
          monthRevenueCents > 0
            ? "Sum of completed signings this month."
            : "Mark a signing complete to start tracking."
        }
        href="/appointments"
      />
      <StatCard
        eyebrow="This week"
        label={`${weekCount} ${weekCount === 1 ? "signing" : "signings"}`}
        value={weekCount.toString()}
        icon={<CalendarDays size={15} strokeWidth={1.75} />}
        helper="Sunday through Saturday."
        href="/appointments"
      />
      <StatCard
        eyebrow="Journal"
        label="Locked entries"
        value={journalCount.toString()}
        icon={<BookOpen size={15} strokeWidth={1.75} />}
        helper="Every signing, permanent, searchable."
        href="/journal"
      />
    </section>
  );
}

function StatCard({
  eyebrow,
  label,
  value,
  icon,
  helper,
  href,
}: {
  eyebrow: string;
  label: string;
  value: string;
  icon: React.ReactNode;
  helper: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 flex items-start gap-4 transition-colors hover:bg-[var(--surface-2)]"
    >
      <span className="h-10 w-10 rounded-[10px] bg-[var(--accent-soft)] text-[var(--accent)] inline-flex items-center justify-center shrink-0">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="t-caption text-[var(--text-subtle)]">{eyebrow}</p>
        <p className="t-h3 mt-1 leading-none">{value}</p>
        <p className="text-xs text-[var(--text-muted)] mt-2">{helper}</p>
      </div>
      <span className="text-[var(--text-subtle)] mt-1.5">
        <ArrowRight size={14} strokeWidth={1.75} />
      </span>
      <span className="sr-only">{label}</span>
    </Link>
  );
}

function FollowUpsCard({ contacts }: { contacts: Contact[] }) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      <div className="px-6 py-5 border-b border-[var(--border)] flex items-center justify-between">
        <div>
          <p className="t-caption text-[var(--text-subtle)] mb-1">Pipeline</p>
          <h2 className="t-h3">Who to follow up with</h2>
        </div>
        <Link href="/pipeline">
          <Button size="sm" variant="ghost">
            All <ArrowRight size={13} strokeWidth={1.75} />
          </Button>
        </Link>
      </div>
      {contacts.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <KanbanSquare size={22} strokeWidth={1.5} className="mx-auto text-[var(--text-subtle)]" />
          <p className="mt-3 text-sm text-[var(--text)]">Nobody&apos;s overdue.</p>
          <p className="mt-1 text-xs text-[var(--text-subtle)]">
            Add a title company you&apos;d like to work with — we&apos;ll remind you to follow up.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--border)]">
          {contacts.map((c) => {
            const days = daysSince(c.last_contacted_at);
            return (
              <li key={c.id}>
                <Link
                  href={`/pipeline/${c.id}`}
                  className="px-6 py-4 flex items-center gap-3 hover:bg-[var(--surface-2)] transition-colors"
                >
                  <span className="shrink-0 h-9 w-9 rounded-[10px] bg-[var(--accent-soft)] text-[var(--accent)] inline-flex items-center justify-center">
                    <Building2 size={14} strokeWidth={1.75} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text)] truncate">
                      {c.company_name}
                    </p>
                    <p className="text-xs text-[var(--text-subtle)] inline-flex items-center gap-1">
                      <Clock size={11} strokeWidth={1.75} />
                      {days === null ? "Never contacted" : `${days}d since last touch`}
                    </p>
                  </div>
                  <span className="text-[var(--text-subtle)]">
                    <ArrowRight size={14} strokeWidth={1.75} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function QuickActionsCard() {
  const actions = [
    { href: "/appointments", icon: CalendarDays, label: "New signing" },
    { href: "/journal/new",   icon: BookOpen,    label: "New journal entry" },
    { href: "/pipeline",      icon: KanbanSquare, label: "Add a contact" },
  ];
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5">
      <p className="t-caption text-[var(--text-subtle)] mb-1">Quick add</p>
      <h2 className="t-h3 mb-4">Get something done</h2>
      <ul className="flex flex-col gap-2">
        {actions.map((a) => (
          <li key={a.href}>
            <Link
              href={a.href}
              className="flex items-center gap-3 px-3 h-11 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--accent)] transition-colors"
            >
              <a.icon size={14} strokeWidth={1.75} className="text-[var(--accent)]" />
              <span className="text-sm text-[var(--text)]">{a.label}</span>
              <ArrowRight size={13} strokeWidth={1.75} className="text-[var(--text-subtle)] ml-auto" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
