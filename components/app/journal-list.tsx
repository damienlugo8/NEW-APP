"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Lock, Search } from "lucide-react";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import type { JournalEntry } from "@/lib/types/journal";

/**
 * Displays the user's locked journal entries newest-first, with a search input
 * that filters across signer name + document type. Sequential entry numbers
 * are computed chronologically (oldest = #1).
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

  if (entries.length === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center">
        <BookOpen
          size={26}
          strokeWidth={1.5}
          className="mx-auto text-[var(--text-subtle)]"
        />
        <p className="mt-4 text-[15px] font-medium">No entries yet.</p>
        <p className="mt-1 text-sm text-[var(--text-muted)] max-w-[44ch] mx-auto">
          Your journal will hold every signing — locked, searchable, and ready
          to print if your state ever asks.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="relative block">
        <Search
          size={14}
          strokeWidth={1.75}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]"
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search signer, document, county…"
          className="h-11 w-full pl-9 pr-3 bg-[var(--surface)] text-[var(--text)] border border-[var(--border-strong)] rounded-[var(--radius-sm)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)]"
        />
      </label>

      <ul className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)] overflow-hidden">
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
                className="block px-4 sm:px-5 py-4 transition-colors hover:bg-[var(--surface-2)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-[var(--text-subtle)]">
                        #{String(n).padStart(4, "0")}
                      </span>
                      <span className="t-caption text-[var(--text-subtle)]">
                        {format(new Date(entry.signed_at), "MMM d, yyyy · h:mm a")}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[15px] font-medium text-[var(--text)] truncate">
                      {entry.signer_name}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)] truncate">
                      {entry.document_type}
                      {entry.location ? ` · ${entry.location}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-mono text-[var(--text-subtle)]">
                    <Lock size={10} strokeWidth={1.75} /> locked
                  </span>
                </div>
              </Link>
            </motion.li>
          );
        })}
        {filtered.length === 0 && (
          <li className="px-5 py-6 text-center text-sm text-[var(--text-subtle)]">
            No entries match &ldquo;{q}&rdquo;.
          </li>
        )}
      </ul>
    </div>
  );
}
