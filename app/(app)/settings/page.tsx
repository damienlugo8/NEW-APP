import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ProfileForm } from "./profile-form";
import { PageHeader } from "@/components/app/page-header";
import { getProfile } from "@/lib/auth/session";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const profile = await getProfile();
  return (
    <div className="mx-auto max-w-[820px] px-5 lg:px-8 py-10 pb-24 lg:pb-12">
      <PageHeader
        eyebrow="Settings"
        title="Profile"
        supporting="The details that appear on your invoices and journal entries. Update once — they apply everywhere."
      />

      <ProfileForm profile={profile} />

      <div className="mt-14 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="t-caption text-[var(--text-subtle)] mb-1">Billing</p>
          <p className="text-sm text-[var(--text)]">
            Subscription, plan, and cancellation.
          </p>
        </div>
        <Link
          href="/settings/billing"
          className="inline-flex items-center gap-1 px-3 h-9 rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--surface-2)] text-sm text-[var(--text)] hover:bg-[var(--surface-3)] transition-colors"
        >
          Manage
          <ArrowUpRight size={13} strokeWidth={1.5} aria-hidden />
        </Link>
      </div>
    </div>
  );
}
