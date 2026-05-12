"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";

const ease = [0.22, 1, 0.36, 1] as const;

const faqs = [
  {
    q: "Is the digital journal legally valid in my state?",
    a: "Yes — in every state that allows electronic notary journals (which is most of them). We capture every field your state board cares about: signer name, ID type, ID issuing state, last four of the ID, the document type, and a witnessed signature. Entries lock the moment you save them. If your state still requires a paper journal too, you can export any entry as a print-ready PDF for your binder.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. From your phone, in two taps, no email and no hold music. Your access continues through the end of the period you paid for. Your data is yours — export it whenever you want.",
  },
  {
    q: "I'm using NotaryGadget (or NotaryAssist, or CloseWise). How do I switch?",
    a: "Most notaries import their last year of signings on day one. We accept CSV exports from every major notary tool, and the support team will hand-import your data if you're not comfortable doing it yourself. There's no overlap month — pay for the new one when you're ready and cancel the old one the same day.",
  },
  {
    q: "Will my data be private?",
    a: "Signer information and journal entries never leave our database. We don't share with advertisers, we don't sell anything, we don't train AI on your records. Every row is locked to your account at the database level — even our own engineers can't read another user's journal without explicit access. Full details on the privacy page.",
  },
  {
    q: "Do I need a separate app for mileage?",
    a: "No. Mileage is built into appointments. When you mark an appointment complete, you can log the miles right there. Quarterly and yearly totals (at the current IRS rate) live one tap away on the dashboard.",
  },
  {
    q: "Does this work on iPhone and Android?",
    a: "Yes. NotaryFlow is a web app that's designed phone-first — add it to your home screen and it behaves like a native app. The dedicated iOS and Android apps are in the works, but everything works today on the phone you have.",
  },
  {
    q: "What about HIPAA-protected signings (hospital signings, end-of-life docs)?",
    a: "You can keep notes private to your account, and the journal entry itself only stores what your state requires (signer name, ID, document type). We don't ask for the document contents. For shops handling unusually sensitive work, the Pro plan includes a per-entry privacy flag that hides the entry summary on shared screens.",
  },
  {
    q: "How fast do you respond to support?",
    a: "Within a few hours during business hours, often faster. Run by a small team that actually uses notaries' tools, not a call center. If you're stuck before an appointment, text the support line and we'll handle it.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-24 md:py-32 border-t border-[var(--border)]">
      <div className="mx-auto max-w-[1200px] px-6 md:px-10 grid gap-16 md:grid-cols-[1fr_1.4fr] md:gap-24">
        <Reveal>
          <p className="t-caption text-[var(--text-subtle)] mb-5">Questions</p>
          <h2 className="t-h2-serif max-w-[16ch]">
            The ones we hear <em>most</em>.
          </h2>
          <p className="t-body text-[var(--text-muted)] mt-6 max-w-[36ch]">
            Don&apos;t see yours? Email{" "}
            <a className="text-[var(--accent)]" href="mailto:hello@notaryflow.app">
              hello@notaryflow.app
            </a>
            . A human writes back.
          </p>
        </Reveal>

        <Reveal>
          <ul className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)] overflow-hidden">
            {faqs.map((item, i) => (
              <Item key={i} q={item.q} a={item.a} />
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

function Item({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  return (
    <li>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full px-5 py-5 flex items-center justify-between gap-4 text-left transition-colors hover:bg-[var(--surface-2)]"
        aria-expanded={open}
      >
        <span className="text-[15px] font-medium pr-4">{q}</span>
        <span className="shrink-0 h-7 w-7 rounded-full border border-[var(--border)] inline-flex items-center justify-center bg-[var(--bg)]">
          {open ? <Minus size={14} /> : <Plus size={14} />}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.28, ease }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 text-sm text-[var(--text-muted)] max-w-[68ch]">{a}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}
