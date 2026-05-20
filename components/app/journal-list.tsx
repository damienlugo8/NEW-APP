"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, Search, FileText } from "lucide-react";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import type { JournalEntry } from "@/lib/types/journal";

/**
 * Displays the user's locked journal entries newest-first, with a search
 * input that filters across signer + document type + location. Sequential
 * entry numbers are computed chronologically (oldest = #1) so the index
 * matches what a state binder would expect.
 *
 * The empty-state branch is owned by the page; here we render zero rows.
 * That keeps the file focused on the meaningful UI: search + the list.
 */
export function JournalList({ entries }: { entries: JournalEntry[] }) {
  const [q, setQ] = useState("");

  // Chronological index map → oldest entry = #1.
  const numbers = useMemo(() => {
    const sorted = [...entries].sort(
      (a, b) => new Date(a.signed_at).getTime() - new Date(b.signed_at).getTime()
    );
    const m = new Map<string, number>();
    sorted.forEach((e, i) => m.set(e.id, i + 1));
    return m;
  }, [entries]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return entries;
    return entries.filter(
      (e) =>
        e.signer_name.toLowerCase().includes(needle) ||
        e.document_type.toLowerCase().includes(needle) ||
        (e.location ?? "").toLowerCase().includes(needle)
    );
  }, [entries, q]);

  return (
    <div className="flex flex-col gap-4">
      <label className="relative block">
        <Search
          size={14}
          strokeWidth={1.5}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]"
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search signer, document, county…"
          className="h-11 w-full pl-10 pr-3 bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] rounded-[var(--radius)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] focus:bg-[var(--surface-2)] transition-colors"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-wider text-[var(--text-subtle)] hover:text-[var(--text-muted)] transition-colors"
            aria-label="Clear search"
          >
            clear
          </button>
        )}
      </label>

      <ul className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border-soft)] overflow-hidden shadow-[var(--shadow-sm)]">
        {filtered.map((entry, i) => {
          const n = numbers.get(entry.id) ?? 0;
          return (
            <motion.li
              key={entry.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, delay: Math.min(i * 0.02, 0.18) }}
            >
              <Link
                href={`/journal/${entry.id}`}
                className="group block px-4 sm:px-5 py-4 transition-colors hover:bg-[var(--surface-2)]"
              >
                <div className="flex items-start gap-4">
                  {/* Entry number — the binder spine */}
                  <div className="shrink-0 w-12 flex flex-col items-center pt-0.5">
                    <span className="t-num-mono text-[10px] text-[var(--text-subtle)] uppercase tracking-wider">
                      No.
                    </span>
                    <span className="t-num-mono text-[15px] text-[var(--text)] font-semibold leading-tight mt-0.5">
                      {String(n).padStart(4, "0")}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[15px] font-medium text-[var(--text)] truncate">
                        {entry.signer_name}
                      </p>
                      <span className="t-caption text-[var(--text-subtle)]">
                        {format(new Date(entry.signed_at), "MMM d, yyyy · h:mm a").toLowerCase()}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--text-muted)] truncate inline-flex items-center gap-1.5">
                      <FileText size={11} strokeWidth={1.5} className="text-[var(--text-subtle)]" />
                      {entry.document_type}
                      {entry.location ? <span className="text-[var(--text-subtle)]">· {entry.location}</span> : null}
                    </p>
                  </div>

                  <span className="shrink-0 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider t-num-mono text-[var(--text-subtle)] mt-1">
                    <Lock size={10} strokeWidth={1.5} /> locked
                  </span>
                </div>
              </Link>
            </motion.li>
          );
        })}
        {filtered.length === 0 && (
          <li className="px-5 py-10 text-center">
            <p className="text-sm text-[var(--text-muted)]">
              No entries match <span className="font-medium text-[var(--text)]">&ldquo;{q}&rdquo;</span>.
            </p>
            <button
              type="button"
              onClick={() => setQ("")}
              className="mt-2 text-xs text-[var(--accent)] hover:underline underline-offset-4"
            >
              Clear search
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}
