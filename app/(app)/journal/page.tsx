import Link from "next/link";
import { Plus, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JournalList } from "@/components/app/journal-list";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { listJournalEntries } from "@/lib/db/queries/journal";

export const metadata = { title: "Journal" };
export const dynamic = "force-dynamic";

export default async function JournalPage() {
  const entries = await listJournalEntries();
  return (
    <div className="mx-auto max-w-[1024px] px-5 lg:px-8 py-8 pb-24 lg:pb-12">
      <PageHeader
        eyebrow="Journal"
        title={
          entries.length === 0
            ? "Your journal."
            : entries.length === 1
            ? "1 entry."
            : `${entries.length} entries.`
        }
        supporting="Every signing, locked the moment you save it. Search by signer or document type. Print any entry as a PDF for your state binder."
        actions={
          <Link href="/journal/new">
            <Button size="sm">
              <Plus size={14} strokeWidth={2} /> New entry
            </Button>
          </Link>
        }
      />

      {entries.length === 0 ? (
        <EmptyState
          variant="page"
          icon={BookOpen}
          italic="A clean ledger."
          title="Log your first signing and lock it forever."
          description="State law says it stays unedited once saved. NotaryFlow handles that automatically — you just sign and go."
          action={
            <Link href="/journal/new">
              <Button size="md">
                <Plus size={14} strokeWidth={2} /> New journal entry
              </Button>
            </Link>
          }
        />
      ) : (
        <JournalList entries={entries} />
      )}
    </div>
  );
}
