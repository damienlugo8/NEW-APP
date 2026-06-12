"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Grain } from "./grain";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * SECTION 3 — What FORGE replaces.
 * Four scattered, slightly-rotated "competitor" phones (Habitica / Opal /
 * MyFitnessPal / Apple Notes) with ember connector lines that draw toward a
 * single FORGE phone in the center — the duct-taped stack collapsing into
 * one app. Pure CSS/SVG + Framer Motion, no images.
 */

interface Corner {
  label: string;
  // anchor for the connector endpoint, in the 0–100 stage viewBox
  cx: number;
  cy: number;
  // resting transform for the phone
  className: string;
  rotate: number;
}

const CORNERS: Corner[] = [
  { label: "Habitica", cx: 17, cy: 24, className: "left-[2%] top-[4%]", rotate: -8 },
  { label: "Opal", cx: 83, cy: 24, className: "right-[2%] top-[4%]", rotate: 7 },
  { label: "MyFitnessPal", cx: 17, cy: 76, className: "left-[2%] bottom-[4%]", rotate: 6 },
  { label: "Apple Notes", cx: 83, cy: 76, className: "right-[2%] bottom-[4%]", rotate: -7 },
];

export function WhatForgeReplaces() {
  const reduce = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const inView = useInView(stageRef, { once: true, margin: "-100px" });

  return (
    <section className="relative overflow-hidden bg-[#0A0A0A] py-24 sm:py-32">
      <Grain />
      <div className="relative z-10 mx-auto max-w-[1100px] px-6">
        {/* Header */}
        <div className="mx-auto max-w-[620px] text-center">
          <h2
            className="text-white"
            style={{
              fontFamily: "var(--font-serif)",
              fontWeight: 500,
              fontSize: "clamp(2.25rem, 6vw, 3.5rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
            }}
          >
            One app. Four replaced.
          </h2>
          <p className="mt-4 text-[17px] text-[#A1A1A1]">
            Stop duct-taping your discipline together.
          </p>
        </div>

        {/* Stage */}
        <div
          ref={stageRef}
          className="relative mx-auto mt-16 h-[400px] w-full max-w-[680px] sm:h-[460px]"
        >
          {/* Connector lines */}
          <svg
            aria-hidden
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
          >
            {CORNERS.map((c) => (
              <motion.line
                key={c.label}
                x1={c.cx}
                y1={c.cy}
                x2={50}
                y2={50}
                stroke="#FF6B1A"
                strokeWidth={0.4}
                strokeDasharray="1.5 1.5"
                vectorEffect="non-scaling-stroke"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={
                  inView
                    ? { pathLength: 1, opacity: 0.5 }
                    : { pathLength: 0, opacity: 0 }
                }
                transition={{ duration: 0.9, ease, delay: 0.3 }}
              />
            ))}
          </svg>

          {/* Competitor phones */}
          {CORNERS.map((c, i) => (
            <motion.div
              key={c.label}
              className={`absolute ${c.className}`}
              initial={{ opacity: 0, scale: 0.9, rotate: c.rotate }}
              animate={
                inView
                  ? { opacity: 0.6, scale: 1, rotate: c.rotate }
                  : { opacity: 0, scale: 0.9, rotate: c.rotate }
              }
              transition={{ duration: 0.6, ease, delay: 0.1 + i * 0.08 }}
            >
              <CompetitorPhone label={c.label} />
            </motion.div>
          ))}

          {/* FORGE phone — center */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.7, ease, delay: 0.5 }}
          >
            <ForgePhone reduce={!!reduce} active={inView} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function CompetitorPhone({ label }: { label: string }) {
  return (
    <div className="flex w-[88px] flex-col items-center gap-2 sm:w-[104px]">
      <div className="h-[120px] w-full rounded-[14px] border border-[#222] bg-[#121212] shadow-[0_8px_24px_-12px_rgba(0,0,0,0.8)] sm:h-[140px]">
        <div className="mx-auto mt-2 h-1 w-6 rounded-full bg-[#2A2A2A]" />
        <div className="space-y-1.5 px-2.5 pt-3">
          <div className="h-1.5 w-3/4 rounded-full bg-[#1F1F1F]" />
          <div className="h-1.5 w-1/2 rounded-full bg-[#1F1F1F]" />
          <div className="h-1.5 w-2/3 rounded-full bg-[#1F1F1F]" />
        </div>
      </div>
      <span
        className="text-[10px] uppercase tracking-[0.08em] text-[#8B877E]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {label}
      </span>
    </div>
  );
}

function ForgePhone({ reduce, active }: { reduce: boolean; active: boolean }) {
  return (
    <motion.div
      animate={
        reduce || !active
          ? undefined
          : { y: [0, -6, 0] }
      }
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className="relative w-[132px] sm:w-[152px]"
    >
      <div
        className="rounded-[20px] border bg-[#0E0D0C] p-3"
        style={{
          borderColor: "#FF6B1A",
          boxShadow:
            "0 0 0 1px rgba(255,107,26,0.4), 0 0 44px -8px rgba(255,107,26,0.55)",
        }}
      >
        <div className="mx-auto mb-3 h-1 w-8 rounded-full bg-[#2A2A2A]" />
        {/* grade chip */}
        <div className="flex flex-col items-center gap-2 py-2">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{
              background:
                "radial-gradient(circle at 50% 35%, rgba(255,107,26,0.28), rgba(255,107,26,0.06))",
              border: "1px solid rgba(255,107,26,0.5)",
            }}
          >
            <span
              className="text-[22px] font-semibold text-[#FF6B1A]"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              S
            </span>
          </div>
          <span
            className="text-[9px] uppercase tracking-[0.14em] text-[#8B877E]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Today
          </span>
        </div>
        {/* mini task rows */}
        <div className="space-y-1.5 pt-1">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-[4px] bg-[#FF6B1A]" />
              <span className="h-1.5 flex-1 rounded-full bg-[#23211F]" />
            </div>
          ))}
        </div>
      </div>
      <span
        className="mt-2 block text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-white"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        FORGE
      </span>
    </motion.div>
  );
}
