"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Grain } from "./grain";
import { EmberParticles } from "./ember-particles";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * SECTION 1 — Hero.
 * Full-viewport, pure #0A0A0A, grain + slow upward ember particles. Bodoni
 * headline at display scale, Geist subhead, two CTAs, a pulsing scroll cue.
 * Forced-dark via hardcoded hex (independent of the app theme toggle).
 */
export function Hero() {
  const reduce = useReducedMotion();

  return (
    <section
      id="hero"
      className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-[#0A0A0A] px-6 text-center"
    >
      <Grain />
      <EmberParticles />

      {/* faint ember floor-glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[40vh]"
        style={{
          background:
            "radial-gradient(60% 100% at 50% 100%, rgba(255,107,26,0.12), transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto flex max-w-[860px] flex-col items-center pb-16 pt-24">
        <motion.h1
          initial={{ opacity: 0, y: reduce ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease }}
          className="text-white"
          style={{
            fontFamily: "var(--font-serif)",
            fontWeight: 500,
            fontSize: "clamp(3.5rem, 11vw, 6rem)",
            lineHeight: 1.0,
            letterSpacing: "-0.03em",
          }}
        >
          Forge yourself.
          <br />
          Daily.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: reduce ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.12 }}
          className="mt-7 max-w-[480px] text-[#A1A1A1]"
          style={{ fontSize: "1.25rem", lineHeight: 1.5 }}
        >
          The discipline app built for men who actually want to change. 75 Hard.
          Nutrition. No scrolling. Squad accountability. One place.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease, delay: 0.22 }}
          className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
        >
          <Link
            href="/onboarding"
            className="inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-[#FF6B1A] px-7 text-[15px] font-medium text-[#0A0A0A] transition-[transform,filter] duration-150 hover:brightness-110 active:translate-y-px sm:w-auto"
          >
            Start for free
          </Link>
          <a
            href="#pillars"
            className="inline-flex h-12 w-full items-center justify-center rounded-[10px] border border-[#2A2A2A] bg-transparent px-7 text-[15px] font-medium text-white transition-colors duration-150 hover:border-[#3A3A3A] hover:bg-white/[0.03] active:translate-y-px sm:w-auto"
          >
            See how it works
          </a>
        </motion.div>
      </div>

      {/* Scroll cue */}
      <motion.a
        href="#stats"
        aria-label="Scroll to learn more"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="absolute inset-x-0 bottom-5 z-10 mx-auto flex w-fit flex-col items-center gap-1.5 px-4 py-2"
      >
        <span
          className="text-[11px] uppercase tracking-[0.2em] text-[#8B877E]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          scroll
        </span>
        <motion.span
          animate={reduce ? undefined : { y: [0, 5, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-[#FF6B1A]"
        >
          <ChevronDown size={18} strokeWidth={2} />
        </motion.span>
      </motion.a>
    </section>
  );
}
