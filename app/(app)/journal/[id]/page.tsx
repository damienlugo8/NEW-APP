import { notFound } from "next/navigation";
import { JournalDetail } from "@/components/app/journal-detail";
import {
  getJournalEntry,
  listJournalEntries,
  entryNumber,
} from "@/lib/db/queries/journal";

export const metadata = { title: "Journal entry" };
export const dynamic = "force-dynamic";

export default async function JournalEntryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string; print?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const [entry, all] = await Promise.all([
    getJournalEntry(id),
    listJournalEntries(),
  ]);
  if (!entry) notFound();

  const n = entryNumber(all, entry.id);

  return (
    <JournalDetail
      entry={entry}
      entryNumber={n}
      justCreated={sp.new === "1"}
      autoPrint={sp.print === "1"}
    />
  );
}
