import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JournalList } from "@/components/app/journal-list";
import { listJournalEntries } from "@/lib/db/queries/journal";

export const metadata = { title: "Journal" };
export const dynamic = "force-dynamic";

export default async function JournalPage() {
  const entries = await listJournalEntries();
  return (
    <div className="mx-auto max-w-[1024px] px-5 lg:px-8 py-8 pb-24 lg:pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <p className="t-caption text-[var(--text-subtle)] mb-2">Journal</p>
          <h1 className="t-h1">
            {entries.length === 0
              ? "Your journal."
              : entries.length === 1
              ? "1 entry."
              : `${entries.length} entries.`}
          </h1>
          <p className="t-body text-[var(--text-muted)] mt-2 max-w-[60ch]">
            Every signing, locked the moment you save it. Search by signer or
            document type. Print any entry as a PDF for your state binder.
          </p>
        </div>
        <Link href="/journal/new">
          <Button size="sm">
            <Plus size={14} strokeWidth={2} /> New entry
          </Button>
        </Link>
      </div>

      <JournalList entries={entries} />
    </div>
  );
}
