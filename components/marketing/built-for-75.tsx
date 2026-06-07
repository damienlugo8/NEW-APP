"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { Grain } from "./grain";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * SECTION 5 — Built for 75 Hard.
 * The wedge. A direct shot at the underdesigned official app, landed with a
 * side-by-side comparison card. Forced-dark #0F0F0F + grain.
 */

const OTHERS = [
  "Basic checklist only",
  "No progress photos",
  "No hard reset protection",
  "Nothing worth sharing at Day 75",
];

const FORGE = [
  "Six-task daily tracker",
  "Daily progress photos + compare",
  "Hold-to-confirm hard reset",
  "Gold receipt at Day 75",
];

export function BuiltFor75() {
  return (
    <section className="relative overflow-hidden bg-[#0F0F0F] py-24 sm:py-32">
      <Grain />
      <div className="relative z-10 mx-auto max-w-[1100px] px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease }}
          className="max-w-[620px]"
        >
          <p
            className="text-[12px] uppercase text-[#FF6B1A]"
            style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.15em" }}
          >
            THE WEDGE
          </p>
          <h2
            className="mt-4 text-white"
            style={{
              fontFamily: "var(--font-serif)",
              fontWeight: 500,
              fontSize: "clamp(2.5rem, 7vw, 4rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
            }}
          >
            The app Andy never built.
          </h2>
          <p className="mt-5 max-w-[520px] text-[17px] leading-[1.6] text-[#A1A1A1]">
            75 Hard has millions of followers and a criminally underdesigned
            official app. FORGE is the companion it deserves. Six daily tasks
            tracked, progress photos with side-by-side compare, hard reset with
            friction proportional to consequence, and a Day 75 receipt built to
            be shared.
          </p>
        </motion.div>

        {/* Comparison card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease, delay: 0.15 }}
          className="mt-12 grid gap-4 sm:grid-cols-2 sm:gap-5"
        >
          {/* Other apps */}
          <div className="rounded-[18px] border border-[#2A2A2A] bg-[#1F1F1F] p-6 sm:p-7">
            <p
              className="text-[12px] uppercase tracking-[0.14em] text-[#6B6B6B]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Other apps
            </p>
            <ul className="mt-5 space-y-3.5">
              {OTHERS.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgba(239,68,68,0.12)]">
                    <X size={13} strokeWidth={3} className="text-[#EF4444]" />
                  </span>
                  <span className="text-[15px] text-[#A1A1A1]">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* FORGE */}
          <div
            className="rounded-[18px] border bg-[#120D08] p-6 sm:p-7"
            style={{
              borderColor: "#FF6B1A",
              boxShadow: "0 0 60px -24px rgba(255,107,26,0.5)",
            }}
          >
            <p
              className="text-[12px] uppercase tracking-[0.14em] text-[#FF6B1A]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              FORGE
            </p>
            <ul className="mt-5 space-y-3.5">
              {FORGE.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgba(34,197,94,0.14)]">
                    <Check size={13} strokeWidth={3} className="text-[#22C55E]" />
                  </span>
                  <span className="text-[15px] text-white">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease, delay: 0.2 }}
          className="mt-10"
        >
          <Link
            href="/onboarding"
            className="inline-flex h-12 items-center justify-center rounded-[10px] bg-[#FF6B1A] px-7 text-[15px] font-medium text-[#0A0A0A] transition-[transform,filter] duration-150 hover:brightness-110 active:translate-y-px"
          >
            Start your 75
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
