import Link from "next/link";
import { ProfileForm } from "./profile-form";
import { getProfile } from "@/lib/auth/session";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const profile = await getProfile();
  return (
    <div className="mx-auto max-w-[820px] px-5 lg:px-8 py-10">
      <div className="mb-10">
        <p className="t-caption text-[var(--text-subtle)] mb-2">Settings</p>
        <h1 className="t-h1">Profile</h1>
        <p className="t-body text-[var(--text-muted)] mt-2">
          The details that appear on your invoices and journal entries.
        </p>
      </div>

      <ProfileForm profile={profile} />

      <div className="mt-14 flex items-center justify-between border-t border-[var(--border)] pt-6">
        <p className="text-sm text-[var(--text-muted)]">
          Manage subscription, plan, and cancellation.
        </p>
        <Link href="/settings/billing" className="text-sm text-[var(--text)] underline underline-offset-4">
          Billing →
        </Link>
      </div>
    </div>
  );
}
