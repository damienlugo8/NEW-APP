"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { Grain } from "./grain";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * SECTION 7 — FAQ. Forced-dark #161616, accordion with a Framer Motion
 * height/opacity expand. One item open at a time. Hairline #2A2A2A dividers.
 */

const ITEMS: { q: string; a: string }[] = [
  {
    q: "Is this actually different from the other Lock In apps?",
    a: "Yes. Most Lock In apps are glorified to-do lists with a paywall. FORGE has a full nutrition tracker, progress photos, a real squad system, and a 75 Hard companion no other app has touched properly.",
  },
  {
    q: "Do I need to be doing 75 Hard to use FORGE?",
    a: "No. 75 Hard is one of five programs. You can run a custom habit stack, a 30-day monk mode, a strength program, or build your own from scratch.",
  },
  {
    q: "What is the SQUAD feature?",
    a: "Five anonymous users grouped together who see each other's daily rating. No social feed, no likes, no DMs. Just a leaderboard that resets weekly. Quit on your habits and your squad sees it.",
  },
  {
    q: "Does FUEL actually work? What AI does it use?",
    a: "You photograph your fridge or current meal. Claude AI identifies the ingredients and builds you a high-protein meal using only what you have, matched to your daily macro target.",
  },
  {
    q: "What is the Lifetime plan exactly?",
    a: "You pay $199 once and have Pro access forever. No monthly charges, no renewal. If we raise prices later, yours never changes.",
  },
  {
    q: "Is BLOCK available now?",
    a: "Web-based screen time controls are live. Full native iOS app blocking via Apple's Screen Time API is coming — we'll notify you the day it ships.",
  },
  {
    q: "Is my data private?",
    a: "Progress photos are encrypted and only you can see them. Squad members only see your anonymous handle and daily rating. We never sell data.",
  },
  {
    q: "How do I cancel?",
    a: "Settings → Subscription → Cancel. Done in 10 seconds. No dark patterns.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="relative overflow-hidden bg-[#161616] py-24 sm:py-32"
    >
      <Grain />
      <div className="relative z-10 mx-auto max-w-[760px] px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease }}
          className="text-white"
          style={{
            fontFamily: "var(--font-serif)",
            fontWeight: 500,
            fontSize: "clamp(2rem, 5vw, 3rem)",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
          }}
        >
          Questions.
        </motion.h2>

        <div className="mt-10 border-t border-[#2A2A2A]">
          {ITEMS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q} className="border-b border-[#2A2A2A]">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                >
                  <span className="text-[16px] font-medium text-white sm:text-[17px]">
                    {item.q}
                  </span>
                  <span className="shrink-0 text-[#FF6B1A]">
                    {isOpen ? (
                      <Minus size={18} strokeWidth={2} />
                    ) : (
                      <Plus size={18} strokeWidth={2} />
                    )}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-[600px] pb-6 text-[15px] leading-[1.65] text-[#A1A1A1]">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
