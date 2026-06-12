"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Camera,
  Check,
  Flame,
  MoonStar,
  Smartphone,
} from "lucide-react";
import { Grain } from "./grain";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * SECTION 4 — The Five Pillars.
 * One full-width row each, layout alternating text/visual. Bodoni headline,
 * ember mono overline, Geist body. Each visual is a styled HTML mock of the
 * real screen (no placeholder images). Text and visual stagger in on scroll.
 */

interface Pillar {
  id: string;
  overline: string;
  headline: string;
  body: string;
  visual: ReactNode;
}

const PILLARS: Pillar[] = [
  {
    id: "daily",
    overline: "EVERY DAY",
    headline: "Show up. Get rated.",
    body: "Build your habit stack, track your streak, get an honest grade from S to F. Every day scored. No excuses accepted.",
    visual: <DailyMock />,
  },
  {
    id: "forge-75",
    overline: "THE PROGRAM",
    headline: "75 days. No days off.",
    body: "The most complete 75 Hard companion ever built. Six tasks, daily progress photos, hard reset if you slip. The receipt at the end is worth every day.",
    visual: <Forge75Mock />,
  },
  {
    id: "fuel",
    overline: "NUTRITION",
    headline: "Photograph your fridge. Eat right.",
    body: "Snap a photo of what you have. AI builds you a high-protein meal in under 15 minutes. Track macros without the obsession.",
    visual: <FuelMock />,
  },
  {
    id: "block",
    overline: "FOCUS",
    headline: "Lock your phone before it locks you.",
    body: "Kill the apps that are killing your time. Schedule blackout windows. Wake-up lock for the first hour of the day. Coming to iOS.",
    visual: <BlockMock />,
  },
  {
    id: "squad",
    overline: "ACCOUNTABILITY",
    headline: "Five guys. One standard.",
    body: "Your squad sees your daily rating. You see theirs. No comments, no likes — just the leaderboard. Quit and you let them down.",
    visual: <SquadMock />,
  },
];

export function Pillars() {
  return (
    <section id="pillars" className="relative overflow-hidden bg-[#0A0A0A]">
      <Grain />
      <div className="relative z-10 mx-auto flex max-w-[1100px] flex-col gap-24 px-6 py-24 sm:gap-32 sm:py-32">
        {PILLARS.map((p, i) => (
          <PillarRow key={p.id} pillar={p} reverse={i % 2 === 1} />
        ))}
      </div>
    </section>
  );
}

function PillarRow({ pillar, reverse }: { pillar: Pillar; reverse: boolean }) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      {/* Text */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease }}
        className={reverse ? "lg:order-2" : "lg:order-1"}
      >
        <p
          className="text-[12px] uppercase text-[#FF6B1A]"
          style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.15em" }}
        >
          {pillar.overline}
        </p>
        <h3
          className="mt-4 text-white"
          style={{
            fontFamily: "var(--font-serif)",
            fontWeight: 500,
            fontSize: "clamp(2rem, 5vw, 3rem)",
            lineHeight: 1.08,
            letterSpacing: "-0.02em",
          }}
        >
          {pillar.headline}
        </h3>
        <p className="mt-5 max-w-[400px] text-[17px] leading-[1.6] text-[#A1A1A1]">
          {pillar.body}
        </p>
      </motion.div>

      {/* Visual */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease, delay: 0.15 }}
        className={reverse ? "lg:order-1" : "lg:order-2"}
      >
        {pillar.visual}
      </motion.div>
    </div>
  );
}

// ── Mock frame ──────────────────────────────────────────────────────────

function MockFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto w-full max-w-[420px] rounded-[20px] border border-[#222] bg-[#0E0D0C] p-5 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]">
      {children}
    </div>
  );
}

function MockHeader({ label, right }: { label: string; right?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <span
        className="text-[11px] uppercase tracking-[0.16em] text-[#8B877E]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {label}
      </span>
      {right}
    </div>
  );
}

// ── DAILY — grade + habit stack ─────────────────────────────────────────

function DailyMock() {
  const habits = [
    { name: "Cold shower", done: true },
    { name: "Read 10 pages", done: true },
    { name: "Train", done: true },
    { name: "No scroll before noon", done: false },
  ];
  return (
    <MockFrame>
      <MockHeader
        label="Daily"
        right={
          <span
            className="text-[11px] text-[#A1A1A1]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Day 128
          </span>
        }
      />
      <div className="mb-5 flex items-center gap-4 rounded-[14px] border border-[#1E1E1E] bg-[#141210] p-4">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full"
          style={{
            background:
              "radial-gradient(circle at 50% 35%, rgba(255,107,26,0.3), rgba(255,107,26,0.05))",
            border: "1px solid rgba(255,107,26,0.5)",
          }}
        >
          <span
            className="text-[34px] font-semibold leading-none text-[#FF6B1A]"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            A
          </span>
        </div>
        <div>
          <p className="text-[15px] font-medium text-white">Strong day.</p>
          <p className="mt-0.5 text-[13px] text-[#8B877E]">3 of 4 logged</p>
        </div>
      </div>
      <div className="space-y-2.5">
        {habits.map((h) => (
          <div
            key={h.name}
            className="flex items-center gap-3 rounded-[10px] border border-[#1B1B1B] bg-[#121110] px-3 py-2.5"
          >
            <span
              className="flex h-5 w-5 items-center justify-center rounded-[6px] border"
              style={
                h.done
                  ? { background: "#FF6B1A", borderColor: "#FF6B1A" }
                  : { borderColor: "#3A3A3A" }
              }
            >
              {h.done && <Check size={12} strokeWidth={3} className="text-[#0A0A0A]" />}
            </span>
            <span
              className={`text-[14px] ${h.done ? "text-white" : "text-[#8B877E]"}`}
            >
              {h.name}
            </span>
          </div>
        ))}
      </div>
    </MockFrame>
  );
}

// ── FORGE 75 — day counter ──────────────────────────────────────────────

function Forge75Mock() {
  const tasks = ["WO1", "WO2", "DIET", "H2O", "READ", "PIC"];
  const done = 5;
  return (
    <MockFrame>
      <MockHeader
        label="Forge 75"
        right={
          <span className="inline-flex items-center gap-1 text-[11px] text-[#FF6B1A]">
            <Flame size={12} strokeWidth={2} /> No resets
          </span>
        }
      />
      <div className="mb-5 flex items-end justify-center gap-1 py-2">
        <span
          className="leading-none text-white"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "4rem",
            fontWeight: 500,
            letterSpacing: "-0.05em",
          }}
        >
          42
        </span>
        <span
          className="pb-2 text-[1.5rem] text-[#8B877E]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          /75
        </span>
      </div>
      {/* progress bar */}
      <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-[#1E1E1E]">
        <div
          className="h-full rounded-full bg-[#FF6B1A]"
          style={{ width: "56%" }}
        />
      </div>
      {/* task dots */}
      <div className="grid grid-cols-6 gap-2">
        {tasks.map((t, i) => (
          <div key={t} className="flex flex-col items-center gap-1.5">
            <span
              className="flex h-9 w-full items-center justify-center rounded-[8px] border"
              style={
                i < done
                  ? {
                      background: "rgba(255,107,26,0.12)",
                      borderColor: "rgba(255,107,26,0.5)",
                    }
                  : { borderColor: "#2A2A2A" }
              }
            >
              {i < done ? (
                <Check size={13} strokeWidth={3} className="text-[#FF6B1A]" />
              ) : (
                <Camera size={13} strokeWidth={2} className="text-[#4A4A4A]" />
              )}
            </span>
            <span
              className="text-[8px] uppercase tracking-[0.06em] text-[#8B877E]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {t}
            </span>
          </div>
        ))}
      </div>
    </MockFrame>
  );
}

// ── FUEL — meal from a photo ────────────────────────────────────────────

function FuelMock() {
  const macros = [
    { k: "Protein", v: "52g", w: "78%" },
    { k: "Carbs", v: "41g", w: "55%" },
    { k: "Fat", v: "18g", w: "32%" },
  ];
  return (
    <MockFrame>
      <MockHeader
        label="Fuel"
        right={
          <span
            className="text-[11px] text-[#A1A1A1]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            14 min
          </span>
        }
      />
      {/* "photo" of the fridge */}
      <div className="mb-4 flex h-28 items-center justify-center rounded-[14px] border border-[#1E1E1E] bg-gradient-to-br from-[#1A1715] to-[#101010]">
        <Camera size={22} strokeWidth={1.5} className="text-[#4A4A4A]" />
      </div>
      <p className="text-[15px] font-medium text-white">
        Chicken, rice &amp; greens
      </p>
      <p className="mb-4 mt-0.5 text-[13px] text-[#8B877E]">
        High-protein · from what you have
      </p>
      <div className="space-y-2.5">
        {macros.map((m) => (
          <div key={m.k}>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[12px] text-[#A1A1A1]">{m.k}</span>
              <span
                className="text-[12px] text-white"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {m.v}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1E1E1E]">
              <div
                className="h-full rounded-full bg-[#FF6B1A]"
                style={{ width: m.w }}
              />
            </div>
          </div>
        ))}
      </div>
    </MockFrame>
  );
}

// ── BLOCK — focus schedule (coming to iOS) ──────────────────────────────

function BlockMock() {
  const apps = [
    { name: "Instagram", blocked: true },
    { name: "TikTok", blocked: true },
    { name: "X", blocked: true },
    { name: "YouTube", blocked: false },
  ];
  return (
    <MockFrame>
      <MockHeader
        label="Block"
        right={
          <span
            className="rounded-full border border-[#2A2A2A] px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-[#8B877E]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Coming to iOS
          </span>
        }
      />
      {/* blackout window */}
      <div className="mb-4 flex items-center gap-3 rounded-[14px] border border-[#1E1E1E] bg-[#141210] p-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(255,107,26,0.12)] text-[#FF6B1A]">
          <MoonStar size={18} strokeWidth={1.75} />
        </span>
        <div>
          <p className="text-[14px] font-medium text-white">Blackout window</p>
          <p
            className="text-[12px] text-[#8B877E]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            10:00 PM — 6:00 AM
          </p>
        </div>
      </div>
      <div className="space-y-2.5">
        {apps.map((a) => (
          <div
            key={a.name}
            className="flex items-center justify-between rounded-[10px] border border-[#1B1B1B] bg-[#121110] px-3 py-2.5"
          >
            <span className="flex items-center gap-2.5 text-[14px] text-white">
              <Smartphone size={14} strokeWidth={1.75} className="text-[#8B877E]" />
              {a.name}
            </span>
            <span
              className="flex h-5 w-9 items-center rounded-full p-0.5"
              style={{
                background: a.blocked ? "#FF6B1A" : "#2A2A2A",
                justifyContent: a.blocked ? "flex-end" : "flex-start",
              }}
            >
              <span className="h-4 w-4 rounded-full bg-[#0A0A0A]" />
            </span>
          </div>
        ))}
      </div>
    </MockFrame>
  );
}

// ── SQUAD — leaderboard ─────────────────────────────────────────────────

function SquadMock() {
  const rows = [
    { name: "Marcus", grade: "S", you: false },
    { name: "You", grade: "A", you: true },
    { name: "Dre", grade: "A", you: false },
    { name: "Sam", grade: "B", you: false },
    { name: "Tobi", grade: "C", you: false },
  ];
  return (
    <MockFrame>
      <MockHeader
        label="Squad"
        right={
          <span
            className="text-[11px] text-[#A1A1A1]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Week 3
          </span>
        }
      />
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div
            key={r.name}
            className="flex items-center gap-3 rounded-[10px] border px-3 py-2.5"
            style={
              r.you
                ? {
                    background: "rgba(255,107,26,0.08)",
                    borderColor: "rgba(255,107,26,0.4)",
                  }
                : { background: "#121110", borderColor: "#1B1B1B" }
            }
          >
            <span
              className="w-4 text-[13px] text-[#8B877E]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {i + 1}
            </span>
            <span className="h-7 w-7 shrink-0 rounded-full bg-[#23211F]" />
            <span
              className={`flex-1 text-[14px] ${r.you ? "font-medium text-white" : "text-[#A1A1A1]"}`}
            >
              {r.name}
            </span>
            <span
              className="text-[18px] font-semibold leading-none"
              style={{
                fontFamily: "var(--font-serif)",
                color: r.you ? "#FF6B1A" : "#6E6A62",
              }}
            >
              {r.grade}
            </span>
          </div>
        ))}
      </div>
    </MockFrame>
  );
}
