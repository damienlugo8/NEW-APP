"use client";

import { NumberTicker } from "./number-ticker";
import { Grain } from "./grain";

/**
 * SECTION 2 — Stats band.
 * Full-width #161616 strip, hairline borders, three count-up stats in Geist
 * Mono. Numbers are seed values for launch (hardcoded) — wire to real DB
 * counts later.
 */

interface Stat {
  value: number;
  label: string;
}

const STATS: Stat[] = [
  { value: 12847, label: "men locked in today" },
  { value: 1204391, label: "total streak days logged" },
  { value: 3891, label: "75 Hard completions" },
];

export function StatsBand() {
  return (
    <section
      id="stats"
      className="relative overflow-hidden border-y border-[#2A2A2A] bg-[#161616]"
    >
      <Grain />
      <div className="relative z-10 mx-auto grid max-w-[1100px] grid-cols-1 gap-10 px-6 py-14 sm:grid-cols-3 sm:gap-6 sm:py-16">
        {STATS.map((s) => (
          <div key={s.label} className="text-center">
            <div
              className="text-white"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "clamp(2.5rem, 6vw, 3rem)",
                fontWeight: 500,
                letterSpacing: "-0.03em",
                lineHeight: 1,
              }}
            >
              <NumberTicker value={s.value} />
            </div>
            <p
              className="mt-3 text-[13px] uppercase text-[#8B877E]"
              style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}
            >
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
