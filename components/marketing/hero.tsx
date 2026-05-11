"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ProductMock } from "./product-mock";
import { ArrowRight } from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  const reduce = useReducedMotion();
  return (
    <section className="relative pt-14 md:pt-24 pb-20 md:pb-28">
      <div className="mx-auto max-w-[1200px] px-6 md:px-10">
        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: reduce ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="t-caption text-[var(--text-subtle)] mb-6 flex items-center gap-2"
        >
          <span className="inline-block h-1 w-1 rounded-full bg-[var(--accent)]" />
          For solo mobile notaries &amp; loan signing agents
        </motion.p>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: reduce ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.05 }}
          className="t-display max-w-[18ch]"
        >
          Run the entire signing business
          <span className="text-[var(--text-muted)]"> from your phone.</span>
        </motion.h1>

        {/* Subhead */}
        <motion.p
          initial={{ opacity: 0, y: reduce ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.12 }}
          className="t-body-lg text-[var(--text-muted)] mt-6 max-w-[58ch]"
        >
          Journal, scheduling, mileage, invoicing — and the first real sales pipeline
          for the outreach that actually grows your income. The notary tools you grew
          up with were built in 2015. This one wasn&apos;t.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease, delay: 0.2 }}
          className="mt-8 flex flex-wrap items-center gap-3"
        >
          <Link href="/sign-up">
            <Button size="lg">Start 14-day trial</Button>
          </Link>
          <Link href="#why">
            <Button size="lg" variant="ghost">
              See what&apos;s different
              <ArrowRight size={16} strokeWidth={1.75} />
            </Button>
          </Link>
          <span className="font-mono text-xs text-[var(--text-subtle)] ml-1">
            No card required.
          </span>
        </motion.div>

        {/* Product mock */}
        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease, delay: 0.35 }}
          className="mt-16 md:mt-24"
        >
          <ProductMock />
        </motion.div>
      </div>
    </section>
  );
}
