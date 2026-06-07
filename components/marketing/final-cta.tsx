"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Grain } from "./grain";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * SECTION 8 — Final CTA. Full-width #0A0A0A, centered. The closer.
 */
export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-[#0A0A0A] py-28 sm:py-36">
      <Grain />
      {/* floor glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[50%]"
        style={{
          background:
            "radial-gradient(50% 100% at 50% 100%, rgba(255,107,26,0.14), transparent 70%)",
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease }}
        className="relative z-10 mx-auto flex max-w-[760px] flex-col items-center px-6 text-center"
      >
        <h2
          className="text-white"
          style={{
            fontFamily: "var(--font-serif)",
            fontWeight: 500,
            fontSize: "clamp(3rem, 9vw, 5rem)",
            lineHeight: 1.0,
            letterSpacing: "-0.03em",
          }}
        >
          Stop being soft.
        </h2>
        <p className="mt-6 text-[18px] text-[#A1A1A1]">
          Day 1 starts when you decide it does.
        </p>
        <Link
          href="/onboarding"
          className="mt-9 inline-flex h-12 items-center justify-center rounded-[10px] bg-[#FF6B1A] px-8 text-[15px] font-medium text-[#0A0A0A] transition-[transform,filter] duration-150 hover:brightness-110 active:translate-y-px"
        >
          Start for free
        </Link>
        <p
          className="mt-5 text-[13px] text-[#6B6B6B]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          No credit card required. 14-day Pro trial included.
        </p>
      </motion.div>
    </section>
  );
}
