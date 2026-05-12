import { Reveal } from "@/components/motion/reveal";
import { Check, X } from "lucide-react";

/**
 * "Why notaries switch" — three opinionated lines, written like talking shit
 * about the incumbents without naming names. Each line gets a small visual
 * sketch in CSS — not stock icons.
 */
export function WhySwitch() {
  return (
    <section id="why" className="py-24 md:py-32 border-t border-[var(--border)]">
      <div className="mx-auto max-w-[1200px] px-6 md:px-10">
        <Reveal>
          <p className="t-caption text-[var(--text-subtle)] mb-5">Why notaries switch</p>
          <h2 className="t-h2-serif max-w-[20ch]">
            We didn&apos;t build this in <em>2007</em>.
          </h2>
          <p className="t-body-lg text-[var(--text-muted)] mt-6 max-w-[58ch]">
            Three honest reasons notaries leave their current tool for ours.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          <Reveal delay={0.0}>
            <Card visual={<YearVisual />}>
              <h3 className="t-h3">Your current tool was built in 2007. Ours wasn&apos;t.</h3>
              <p className="t-body text-[var(--text-muted)] mt-3">
                We ship updates every week. The notary software you&apos;re using
                ships them twice a year, if that. You can feel the difference the
                first day you use it.
              </p>
            </Card>
          </Reveal>
          <Reveal delay={0.06}>
            <Card visual={<GrowthVisual />}>
              <h3 className="t-h3">Other tools track the work you&apos;ve done. We help you get more.</h3>
              <p className="t-body text-[var(--text-muted)] mt-3">
                Every notary platform is built around the journal — the receipt
                of work already done. NotaryFlow gives you a real pipeline for
                the title companies, signing services, and law firms you&apos;re
                trying to land.
              </p>
            </Card>
          </Reveal>
          <Reveal delay={0.12}>
            <Card visual={<PhoneVisual />}>
              <h3 className="t-h3">Built for the phone in your hand, not the desk you don&apos;t sit at.</h3>
              <p className="t-body text-[var(--text-muted)] mt-3">
                Log a signing on the curb. Add a contact between appointments.
                Pull up a journal entry while you&apos;re on hold with a title
                company. It works on a 375-pixel screen because it was designed
                there first.
              </p>
            </Card>
          </Reveal>
        </div>

        {/* Honest comparison table, no logos, just the truth. */}
        <Reveal delay={0.05}>
          <div className="mt-20 rounded-[var(--radius-lg)] border border-[var(--border)] overflow-hidden bg-[var(--surface)]">
            <div className="grid grid-cols-[1fr_110px_110px] items-center px-5 py-3 border-b border-[var(--border)] bg-[var(--surface-2)]">
              <span className="t-caption text-[var(--text-subtle)]">What you get</span>
              <span className="t-caption text-[var(--text-subtle)] text-center">Other tools*</span>
              <span className="t-caption text-[var(--accent)] text-center">NotaryFlow</span>
            </div>
            <ComparisonRow label="Notary journal (state-compliant)"     other ours />
            <ComparisonRow label="Appointments &amp; mileage"           other ours />
            <ComparisonRow label="Client invoicing"                     other ours />
            <ComparisonRow label="Sales pipeline / CRM"                       ours />
            <ComparisonRow label="Last-contact reminders"                     ours />
            <ComparisonRow label="Revenue by referrer"                        ours />
            <ComparisonRow label="Built mobile-first"                         ours />
            <ComparisonRow label="Weekly product updates"                     ours />
            <p className="px-5 py-3 text-[11px] text-[var(--text-subtle)] font-mono uppercase tracking-wider">
              * Based on publicly listed features as of 2026.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Card({ children, visual }: { children: React.ReactNode; visual: React.ReactNode }) {
  return (
    <div className="p-7 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] h-full flex flex-col">
      <div className="mb-7 h-32 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] overflow-hidden">
        {visual}
      </div>
      {children}
    </div>
  );
}

function ComparisonRow({ label, other, ours }: { label: string; other?: boolean; ours?: boolean }) {
  return (
    <div className="grid grid-cols-[1fr_110px_110px] items-center px-5 py-3.5 border-b border-[var(--border)] last:border-b-0">
      <span className="text-sm" dangerouslySetInnerHTML={{ __html: label }} />
      <span className="text-center">
        {other ? (
          <Check size={16} className="inline text-[var(--text-subtle)]" />
        ) : (
          <X size={16} className="inline text-[var(--text-subtle)] opacity-40" />
        )}
      </span>
      <span className="text-center">
        {ours ? <Check size={16} className="inline text-[var(--accent)]" /> : null}
      </span>
    </div>
  );
}

/* ─── Tiny CSS visuals — no stock icons, no orbs. */

function YearVisual() {
  // A year-line. 2007 dim, 2026 bright with accent dot.
  return (
    <div className="h-full w-full flex items-center justify-center px-5">
      <div className="w-full">
        <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-subtle)] mb-2">
          <span>2007</span>
          <span>2026</span>
        </div>
        <div className="relative h-px bg-[var(--border-strong)]">
          <span className="absolute -left-0.5 -top-1 h-2 w-2 rounded-full bg-[var(--border-strong)]" />
          <span className="absolute -right-0.5 -top-1.5 h-3 w-3 rounded-full bg-[var(--accent)] ring-4 ring-[var(--accent-soft)]" />
        </div>
      </div>
    </div>
  );
}

function GrowthVisual() {
  // A pipeline arrow: 4 stacked bars rising left-to-right.
  return (
    <div className="h-full w-full flex items-end justify-between gap-1.5 px-6 py-5">
      {[18, 32, 48, 76].map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm"
          style={{
            height: `${h}%`,
            background: i === 3 ? "var(--accent)" : "var(--border-strong)",
            opacity: i === 3 ? 1 : 0.7,
          }}
        />
      ))}
    </div>
  );
}

function PhoneVisual() {
  // A miniature phone outline with two stacked rows inside.
  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="relative w-[68px] h-[112px] rounded-[10px] border border-[var(--border-strong)] bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden">
        <div className="h-2 mx-auto mt-1.5 w-6 rounded-full bg-[var(--border)]" />
        <div className="p-2 mt-1.5 space-y-1.5">
          <div className="h-2 rounded bg-[var(--accent)]/80" />
          <div className="h-2 rounded bg-[var(--border)]" />
          <div className="h-2 w-3/4 rounded bg-[var(--border)]" />
          <div className="h-2 w-1/2 rounded bg-[var(--border)]" />
        </div>
      </div>
    </div>
  );
}
