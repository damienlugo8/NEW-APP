import { ProfileSection, Card } from "./profile-section";
import { SubscriptionSection } from "./subscription-section";
import { NotificationsSection } from "./notifications-section";
import { DangerZone } from "./danger-zone";
import { ThemeToggle } from "@/components/theme-toggle";
import { getProfile } from "@/lib/auth/session";
import { stripeConfigured } from "@/lib/env";

export const metadata = { title: "Settings" };

// Subscription state lives on the profile row (kept current by the Stripe
// webhook). Status is derived from plan — free / active / lifetime.
function statusFor(plan: string): string {
  if (plan === "lifetime") return "lifetime";
  if (plan === "free") return "free";
  return "active";
}

export default async function SettingsPage() {
  const profile = await getProfile();

  const plan = profile?.plan ?? "free";
  const status = statusFor(plan);

  return (
    <div className="mx-auto max-w-[760px] px-5 lg:px-8 py-10 pb-24 lg:pb-14">
      <header className="mb-8">
        <p
          className="text-[11px] uppercase tracking-[0.15em] text-[var(--accent)] mb-2"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Settings
        </p>
        <h1 className="text-[28px] font-semibold text-[var(--text)] tracking-[-0.01em]">
          Your account
        </h1>
      </header>

      <div className="flex flex-col gap-5">
        <ProfileSection profile={profile} />

        <SubscriptionSection
          plan={plan}
          status={status}
          currentPeriodEnd={profile?.current_period_end ?? null}
          stripeReady={stripeConfigured}
        />

        <NotificationsSection prefs={profile?.notifications_prefs ?? null} />

        <Card title="Appearance" caption="Theme">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-[var(--text-muted)]">
              FORGE is dark by default. Light mode is here if you need it.
            </p>
            <ThemeToggle />
          </div>
        </Card>

        <DangerZone />
      </div>
    </div>
  );
}
