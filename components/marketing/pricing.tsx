"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Grain } from "./grain";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * SECTION 6 — Pricing. Free / Pro / Lifetime. Forced-dark #0A0A0A with grain.
 * Pro is the hero card (ember border, MOST POPULAR badge). All CTAs route to
 * /onboarding for now — billing happens post-onboarding.
 */

const FREE_FEATURES = [
  "1 active streak",
  "Basic habit checklist",
  "3 FUEL scans per week",
  "Join 1 squad",
  "Hard 75 tracker",
];

const PRO_FEATURES = [
  "Everything in Free",
  "Unlimited streaks + squads",
  "Unlimited FUEL scans + AI coach",
  "BLOCK tab (web)",
  "Progress photo timeline",
  "Streak milestone cards",
  "Referral rewards",
];

const LIFETIME_FEATURES = [
  "Everything in Pro",
  "Unlimited streaks + squads",
  "Unlimited FUEL scans + AI coach",
  "BLOCK tab (web)",
  "Progress photo timeline",
  "Streak milestone cards",
  "Locked in for life",
];

export function Pricing() {
  return (
    <section
      id="pricing"
      className="relative overflow-hidden bg-[#0A0A0A] py-24 sm:py-32"
    >
      <Grain />
      <div className="relative z-10 mx-auto max-w-[1100px] px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease }}
          className="text-center text-white"
          style={{
            fontFamily: "var(--font-serif)",
            fontWeight: 500,
            fontSize: "clamp(2.25rem, 6vw, 3.5rem)",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
          }}
        >
          Simple pricing. No tricks.
        </motion.h2>

        <div className="mt-14 grid items-start gap-5 lg:grid-cols-3">
          {/* FREE */}
          <PlanCard delay={0}>
            <div className="rounded-[20px] border border-[#2A2A2A] bg-[#161616] p-7">
              <p
                className="text-white"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "2.5rem",
                  fontWeight: 500,
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                }}
              >
                Free
              </p>
              <p className="mt-2 text-[14px] text-[#6B6B6B]">Forever</p>
              <FeatureList items={FREE_FEATURES} />
              <CtaLink href="/onboarding" variant="bordered">
                Get started
              </CtaLink>
            </div>
          </PlanCard>

          {/* PRO */}
          <PlanCard delay={0.1} featured>
            <div
              className="relative rounded-[20px] border-2 bg-[#1A1108] p-7"
              style={{
                borderColor: "#FF6B1A",
                boxShadow: "0 0 70px -26px rgba(255,107,26,0.6)",
              }}
            >
              <span
                className="absolute -top-3 left-7 rounded-full bg-[#FF6B1A] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#0A0A0A]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Most popular
              </span>
              <div className="flex items-end gap-1.5">
                <span
                  className="text-white"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "3rem",
                    fontWeight: 500,
                    letterSpacing: "-0.04em",
                    lineHeight: 1,
                  }}
                >
                  $9.99
                </span>
                <span
                  className="pb-1 text-[#A1A1A1]"
                  style={{ fontSize: "1.25rem", fontFamily: "var(--font-mono)" }}
                >
                  /mo
                </span>
              </div>
              <p className="mt-2 text-[14px] text-[#6B6B6B]">$79/yr</p>
              <FeatureList items={PRO_FEATURES} />
              <CtaLink href="/onboarding" variant="ember">
                Start 14-day trial
              </CtaLink>
            </div>
          </PlanCard>

          {/* LIFETIME */}
          <PlanCard delay={0.2}>
            <div className="rounded-[20px] border border-[#2A2A2A] bg-[#161616] p-7">
              <p
                className="text-white"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "2.5rem",
                  fontWeight: 500,
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                }}
              >
                $199
              </p>
              <p className="mt-2 text-[14px] text-[#6B6B6B]">One time. Forever.</p>
              <p className="mt-4 text-[15px] text-[#A1A1A1]">
                Everything in Pro. Pay once.
              </p>
              <FeatureList items={LIFETIME_FEATURES} />
              <CtaLink href="/onboarding" variant="bordered">
                Go lifetime
              </CtaLink>
            </div>
          </PlanCard>
        </div>

        <p className="mt-10 text-center text-[14px] text-[#6B6B6B]">
          14-day free trial on Pro. Cancel anytime. No questions asked.
        </p>
      </div>
    </section>
  );
}

function PlanCard({
  children,
  delay,
  featured,
}: {
  children: React.ReactNode;
  delay: number;
  featured?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease, delay }}
      className={featured ? "lg:-mt-3" : undefined}
    >
      {children}
    </motion.div>
  );
}

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="mt-6 space-y-3 border-t border-[#2A2A2A] pt-6">
      {items.map((f) => (
        <li key={f} className="flex items-start gap-3">
          <Check
            size={16}
            strokeWidth={2.5}
            className="mt-0.5 shrink-0 text-[#FF6B1A]"
          />
          <span className="text-[15px] text-[#D4D4D4]">{f}</span>
        </li>
      ))}
    </ul>
  );
}

function CtaLink({
  href,
  variant,
  children,
}: {
  href: string;
  variant: "ember" | "bordered";
  children: React.ReactNode;
}) {
  const base =
    "mt-7 inline-flex h-11 w-full items-center justify-center rounded-[10px] px-5 text-[15px] font-medium transition-[transform,filter,background-color,border-color] duration-150 active:translate-y-px";
  const styles =
    variant === "ember"
      ? "bg-[#FF6B1A] text-[#0A0A0A] hover:brightness-110"
      : "border border-[#2A2A2A] text-white hover:border-[#3A3A3A] hover:bg-white/[0.03]";
  return (
    <Link href={href} className={`${base} ${styles}`}>
      {children}
    </Link>
  );
}
