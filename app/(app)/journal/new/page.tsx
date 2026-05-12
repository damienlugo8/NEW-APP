import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { JournalForm } from "@/components/app/journal-form";
import { listAppointments } from "@/lib/db/queries/appointments";

export const metadata = { title: "New journal entry" };
export const dynamic = "force-dynamic";

export default async function NewJournalEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ appointment?: string }>;
}) {
  const sp = await searchParams;
  const appointments = await listAppointments();

  return (
    <div className="mx-auto max-w-[760px] px-5 lg:px-8 py-8 pb-24 lg:pb-12">
      <Link
        href="/journal"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors mb-6"
      >
        <ArrowLeft size={14} strokeWidth={1.75} /> Journal
      </Link>

      <div className="mb-8">
        <p className="t-caption text-[var(--text-subtle)] mb-2">New entry</p>
        <h1 className="t-h1">Record a signing.</h1>
        <p className="t-body text-[var(--text-muted)] mt-2 max-w-[60ch]">
          Capture the legally-required details, witness the signature, and
          we&apos;ll lock it for you.
        </p>
      </div>

      <JournalForm
        appointments={appointments}
        preselectedAppointmentId={sp.appointment}
      />
    </div>
  );
}
