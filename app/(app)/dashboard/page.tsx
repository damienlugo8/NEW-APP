import { CalendarDays, Banknote, Receipt, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-[1280px] px-5 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
        <div>
          <p className="t-caption text-[var(--text-subtle)] mb-2">Today</p>
          <h1 className="t-h1">Good morning.</h1>
          <p className="t-body text-[var(--text-muted)] mt-2 max-w-[60ch]">
            Here&apos;s where things stand. We&apos;ll fill these in as you add appointments and signings.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <EmptySection
          icon={CalendarDays}
          eyebrow="Today"
          title="No signings on the calendar."
          body="Add your next signing and it'll appear here — with the address, fee, and a one-tap nav link."
          cta="Add a signing"
          example="Loan signing — 47 Ridge Rd, Mahwah NJ — 2:30 PM"
        />
        <EmptySection
          icon={Banknote}
          eyebrow="This month"
          title="$0 earned."
          body="Once you start logging fees, you'll see month-to-date earnings and a pace projection here."
          example="May 2026 · pace: $3,247 · 9 signings"
        >
          <Badge tone="accent">Pro: revenue by referrer</Badge>
        </EmptySection>
        <EmptySection
          icon={Receipt}
          eyebrow="Invoices"
          title="No invoices outstanding."
          body="Track who owes you and send a polite nudge with one tap. Stripe-powered payment links coming soon."
          example="First American Title · $185 · 12 days overdue"
        />
        <EmptySection
          icon={BookOpen}
          eyebrow="Journal"
          title="No recent entries."
          body="Your last 10 journal entries surface here. Tap to add a new one — we keep them state-compliant for you."
          example="Powers of Attorney · Lila B. · Bergen County, NJ"
        />
      </div>
    </div>
  );
}

function EmptySection({
  icon: Icon,
  eyebrow,
  title,
  body,
  cta,
  example,
  children,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  eyebrow: string;
  title: string;
  body: string;
  cta?: string;
  example?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-7 flex flex-col">
      <div className="flex items-center justify-between">
        <p className="t-caption text-[var(--text-subtle)]">{eyebrow}</p>
        <div className="h-9 w-9 rounded-[8px] bg-[var(--accent-soft)] text-[var(--accent)] inline-flex items-center justify-center">
          <Icon size={16} strokeWidth={1.75} />
        </div>
      </div>
      <h2 className="t-h3 mt-4">{title}</h2>
      <p className="text-sm text-[var(--text-muted)] mt-2 max-w-[44ch]">{body}</p>

      {/* Example chip — gives the empty state a concrete reference */}
      {example && (
        <div className="mt-5 rounded-[var(--radius-sm)] border border-dashed border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-[12px] text-[var(--text-subtle)] font-mono">
          e.g. {example}
        </div>
      )}

      <div className="flex items-center justify-between mt-auto pt-6">
        {cta ? (
          <span className="t-caption text-[var(--text-subtle)]">{cta} — coming soon</span>
        ) : (
          <span className="t-caption text-[var(--text-subtle)]">Coming soon</span>
        )}
        {children}
      </div>
    </section>
  );
}
