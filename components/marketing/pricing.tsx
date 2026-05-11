import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const tiers = [
  {
    id: "trial",
    name: "Trial",
    price: "Free",
    cadence: "14 days",
    blurb: "Everything in Pro, no card needed. So you can decide on the work, not the marketing.",
    cta: "Start free trial",
    href: "/sign-up?plan=trial",
    featured: false,
    features: [
      "Full journal & appointments",
      "Pipeline CRM",
      "Mileage & invoicing",
      "1 user",
    ],
  },
  {
    id: "solo",
    name: "Solo",
    price: "$19",
    cadence: "per month",
    blurb: "The signing essentials. For notaries focused on closing the work in front of them.",
    cta: "Choose Solo",
    href: "/sign-up?plan=solo",
    featured: false,
    features: [
      "Notary journal (state-compliant)",
      "Appointments & calendar sync",
      "Mileage tracking",
      "Invoicing & payment links",
      "Email support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$39",
    cadence: "per month",
    blurb: "Everything in Solo, plus the differentiator — the sales pipeline that turns rosters into revenue.",
    cta: "Choose Pro",
    href: "/sign-up?plan=pro",
    featured: true,
    features: [
      "Everything in Solo",
      "Pipeline CRM",
      "Last-contact reminders",
      "Revenue by referrer",
      "Custom invoice branding",
      "Priority support",
    ],
  },
] as const;

export function Pricing() {
  return (
    <section id="pricing" className="py-24 md:py-32 border-t border-[var(--border)]">
      <div className="mx-auto max-w-[1200px] px-6 md:px-10">
        <Reveal>
          <p className="t-caption text-[var(--text-subtle)] mb-5">Pricing</p>
          <h2 className="t-h1 max-w-[18ch]">
            One price for the work. One for the pipeline.
          </h2>
          <p className="t-body-lg text-[var(--text-muted)] mt-6 max-w-[58ch]">
            Cancel anytime. Annual billing saves 20% — available once we wire payments
            live. Until then, the trial gives you the whole product.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {tiers.map((t, i) => (
            <Reveal key={t.id} delay={i * 0.06}>
              <PricingCard tier={t} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingCard({ tier }: { tier: (typeof tiers)[number] }) {
  return (
    <div
      className={
        "relative h-full flex flex-col rounded-[var(--radius-lg)] border p-7 " +
        (tier.featured
          ? "border-[var(--accent)] bg-[var(--surface)] shadow-[var(--shadow-md)]"
          : "border-[var(--border)] bg-[var(--surface)]")
      }
    >
      {tier.featured && (
        <span className="absolute -top-2.5 left-7 t-caption px-2 py-0.5 rounded-full bg-[var(--accent)] text-[var(--accent-fg)]">
          The differentiator
        </span>
      )}
      <div className="flex items-baseline justify-between">
        <h3 className="t-h3">{tier.name}</h3>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-[44px] leading-none font-medium tracking-tight font-mono">{tier.price}</span>
        <span className="text-sm text-[var(--text-muted)]">{tier.cadence}</span>
      </div>
      <p className="mt-4 text-sm text-[var(--text-muted)] min-h-[3.5em]">{tier.blurb}</p>

      <ul className="mt-6 flex flex-col gap-2.5">
        {tier.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm">
            <Check size={15} strokeWidth={1.75} className="text-[var(--accent)] mt-[2px] shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-7 pt-6 border-t border-[var(--border)]">
        <Link href={tier.href} className="block">
          <Button variant={tier.featured ? "primary" : "secondary"} className="w-full">
            {tier.cta}
          </Button>
        </Link>
      </div>
    </div>
  );
}
