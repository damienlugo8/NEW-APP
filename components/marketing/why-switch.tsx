import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { Check, X } from "lucide-react";

/**
 * "Why notaries switch" — editorial layout, not a feature grid.
 * Left column: the argument. Right column: a comparison table that names
 * the incumbents directly. Confidence > vagueness.
 */
export function WhySwitch() {
  return (
    <section id="why" className="py-24 md:py-32 border-t border-[var(--border)]">
      <div className="mx-auto max-w-[1200px] px-6 md:px-10 grid gap-16 md:grid-cols-[1fr_1.1fr] md:gap-24">
        <Reveal>
          <p className="t-caption text-[var(--text-subtle)] mb-5">The gap</p>
          <h2 className="t-h1 max-w-[16ch]">
            Other tools log what already happened. Yours grows what comes next.
          </h2>
          <p className="t-body-lg text-[var(--text-muted)] mt-6 max-w-[42ch]">
            Every notary platform on the market is built around the journal — the
            receipt of work done. None of them helps you do the part that actually
            decides your income: keeping in touch with title companies, signing
            services, and law firms.
          </p>
          <p className="t-body text-[var(--text-muted)] mt-4 max-w-[42ch]">
            NotaryFlow ships with a real pipeline CRM. Track every contact, every
            follow-up, every won deal — alongside the journal you already need.
          </p>
        </Reveal>

        <Reveal delay={0.05}>
          <ComparisonTable />
        </Reveal>
      </div>

      {/* Pipeline detail callout */}
      <div id="pipeline" className="mt-24 md:mt-32">
        <div className="mx-auto max-w-[1200px] px-6 md:px-10">
          <Stagger className="grid gap-6 md:grid-cols-3" gap={0.08}>
            <Pillar
              eyebrow="01 — Track"
              title="Every conversation, one place."
              body="Log calls, emails, and visits per company. Set a next-action date and the system surfaces it on the day."
            />
            <Pillar
              eyebrow="02 — Score"
              title="Know which leads are worth your gas."
              body="Pipeline value, average fee per company, days-since-contact — surfaced before you drive thirty miles for a $90 print-and-sign."
            />
            <Pillar
              eyebrow="03 — Close"
              title="Turn cold rosters into repeat work."
              body="When a signing closes, it's automatically attributed to the company that referred it. See your real top customers, not your loudest ones."
            />
          </Stagger>
        </div>
      </div>
    </section>
  );
}

function Pillar({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <StaggerItem className="p-6 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)]">
      <p className="t-caption text-[var(--accent)] mb-4">{eyebrow}</p>
      <h3 className="t-h3 mb-3">{title}</h3>
      <p className="t-body text-[var(--text-muted)]">{body}</p>
    </StaggerItem>
  );
}

function ComparisonTable() {
  const rows = [
    { feature: "Notary journal",          others: true,  ours: true  },
    { feature: "Appointments & mileage",  others: true,  ours: true  },
    { feature: "Client invoicing",        others: true,  ours: true  },
    { feature: "Sales pipeline / CRM",    others: false, ours: true  },
    { feature: "Last-contact reminders",  others: false, ours: true  },
    { feature: "Revenue by referrer",     others: false, ours: true  },
    { feature: "Built for the phone",     others: false, ours: true  },
    { feature: "Dark mode that looks designed", others: false, ours: true },
  ];
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] overflow-hidden bg-[var(--surface)]">
      <div className="grid grid-cols-[1fr_110px_110px] items-center px-5 py-3 border-b border-[var(--border)] bg-[var(--surface-2)]">
        <span className="t-caption text-[var(--text-subtle)]">Feature</span>
        <span className="t-caption text-[var(--text-subtle)] text-center">Others*</span>
        <span className="t-caption text-[var(--accent)] text-center">NotaryFlow</span>
      </div>
      <ul>
        {rows.map((r) => (
          <li
            key={r.feature}
            className="grid grid-cols-[1fr_110px_110px] items-center px-5 py-3.5 border-b border-[var(--border)] last:border-b-0"
          >
            <span className="text-sm">{r.feature}</span>
            <span className="text-center">
              {r.others ? (
                <Check size={16} strokeWidth={1.75} className="inline text-[var(--text-subtle)]" />
              ) : (
                <X size={16} strokeWidth={1.75} className="inline text-[var(--text-subtle)] opacity-40" />
              )}
            </span>
            <span className="text-center">
              <Check size={16} strokeWidth={1.75} className="inline text-[var(--accent)]" />
            </span>
          </li>
        ))}
      </ul>
      <p className="px-5 py-3 text-[11px] text-[var(--text-subtle)] font-mono uppercase tracking-wider">
        * NotaryGadget, NotaryAssist, CloseWise — as of 2026
      </p>
    </div>
  );
}
