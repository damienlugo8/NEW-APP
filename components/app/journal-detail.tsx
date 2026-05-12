"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Check, Lock, Printer } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SignatureView } from "@/components/app/signature-pad";
import type { JournalEntry } from "@/lib/types/journal";
import { usdCents } from "@/lib/utils";

/**
 * Locked detail view + print-friendly stylesheet.
 *
 * "Export PDF" really just opens the system print dialog (window.print()).
 * Every modern browser — including iOS and Android — lets the user save the
 * printable view as a PDF from there. No PDF library, no server round-trip.
 *
 * The `print:` Tailwind variants below define what the print sheet looks
 * like. We hide the app chrome (nav, footer, buttons) and lay the entry out
 * as a clean form.
 */
export function JournalDetail({
  entry,
  entryNumber,
  justCreated,
  autoPrint,
}: {
  entry: JournalEntry;
  entryNumber: number;
  justCreated?: boolean;
  autoPrint?: boolean;
}) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (autoPrint) {
      // Defer a tick so layout settles, then open the print dialog.
      const t = setTimeout(() => window.print(), 250);
      return () => clearTimeout(t);
    }
  }, [autoPrint]);

  const at = new Date(entry.signed_at);

  return (
    <div className="mx-auto max-w-[840px] px-5 lg:px-8 py-8 pb-24 lg:pb-12">
      <div className="print:hidden flex items-center justify-between mb-6">
        <Link
          href="/journal"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
        >
          <ArrowLeft size={14} strokeWidth={1.75} /> All entries
        </Link>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => window.print()}
        >
          <Printer size={14} strokeWidth={1.75} /> Print / save PDF
        </Button>
      </div>

      {justCreated && (
        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32 }}
          className="print:hidden rounded-[var(--radius)] border border-[color-mix(in_oklab,var(--success)_30%,transparent)] bg-[color-mix(in_oklab,var(--success)_10%,transparent)] px-4 py-3 mb-5 flex items-center gap-2 text-sm text-[var(--success)]"
        >
          <Check size={16} strokeWidth={2} /> Entry saved and locked. You&apos;re all set.
        </motion.div>
      )}

      <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden print:border-0 print:rounded-none">
        <header className="px-6 sm:px-8 py-6 border-b border-[var(--border)] flex items-start justify-between gap-4 print:py-4">
          <div>
            <p className="t-caption text-[var(--text-subtle)] mb-2">
              Journal entry · #{String(entryNumber).padStart(4, "0")}
            </p>
            <h1 className="t-h2 print:text-2xl">{entry.signer_name}</h1>
            <p className="t-body text-[var(--text-muted)] mt-1">
              {entry.document_type} ·{" "}
              {format(at, "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
          <Badge tone="neutral" className="print:hidden">
            <Lock size={10} strokeWidth={2} /> locked
          </Badge>
        </header>

        <dl className="divide-y divide-[var(--border)]">
          <Field label="Signer name" value={entry.signer_name} />
          <Field label="Signer address" value={entry.signer_address} />
          <Field label="Document type" value={entry.document_type} />
          <Field
            label="Signed at"
            value={format(at, "EEEE, MMMM d, yyyy 'at' h:mm a")}
          />
          <Field label="Location" value={entry.location} />
          <Field
            label="ID type"
            value={
              entry.id_type
                ? `${entry.id_type}${
                    entry.id_number_last4 ? ` · ends in ${entry.id_number_last4}` : ""
                  }${
                    entry.id_issuing_state ? ` · ${entry.id_issuing_state}` : ""
                  }`
                : null
            }
          />
          <Field label="Credible witness" value={entry.witness_name} />
          <Field
            label="Fee charged"
            value={
              (entry.fee_charged_cents ?? entry.fee_cents) > 0
                ? usdCents(entry.fee_charged_cents ?? entry.fee_cents)
                : null
            }
          />
          {entry.notes && (
            <div className="px-6 sm:px-8 py-4">
              <p className="t-caption text-[var(--text-subtle)] mb-1">Notes</p>
              <p className="text-sm text-[var(--text)] whitespace-pre-wrap">
                {entry.notes}
              </p>
            </div>
          )}

          {entry.signature_svg && (
            <div className="px-6 sm:px-8 py-6">
              <p className="t-caption text-[var(--text-subtle)] mb-2">
                Signer signature
              </p>
              <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-white p-3 print:border-black/40">
                <SignatureView
                  svg={entry.signature_svg}
                  className="[&_svg]:w-full [&_svg]:h-[140px] [&_path]:fill-black"
                />
              </div>
            </div>
          )}
        </dl>

        <footer className="px-6 sm:px-8 py-4 border-t border-[var(--border)] flex items-center justify-between text-[11px] font-mono text-[var(--text-subtle)] print:py-3">
          <span>id: {entry.id}</span>
          <span>NotaryFlow journal</span>
        </footer>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="px-6 sm:px-8 py-3.5 grid grid-cols-[140px_1fr] gap-4 items-baseline">
      <dt className="t-caption text-[var(--text-subtle)]">{label}</dt>
      <dd className="text-sm text-[var(--text)]">{value ?? <span className="text-[var(--text-subtle)]">—</span>}</dd>
    </div>
  );
}
