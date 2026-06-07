import { ProfileSection, Card } from "./profile-section";
import { SubscriptionSection } from "./subscription-section";
import { NotificationsSection } from "./notifications-section";
import { DangerZone } from "./danger-zone";
import { ThemeToggle } from "@/components/theme-toggle";
import { getProfile } from "@/lib/auth/session";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured, stripeConfigured } from "@/lib/env";

export const metadata = { title: "Settings" };

type Sub = {
  status?: string | null;
  plan?: string | null;
  current_period_end?: string | null;
};

export default async function SettingsPage() {
  const profile = await getProfile();

  let sub: Sub | null = null;
  if (supabaseConfigured) {
    const sb = await supabaseServer();
    if (sb) {
      const { data: u } = await sb.auth.getUser();
      if (u.user) {
        const { data } = await sb
          .from("subscriptions")
          .select("status, plan, current_period_end")
          .eq("user_id", u.user.id)
          .maybeSingle();
        sub = data as Sub | null;
      }
    }
  }

  const plan = sub?.plan ?? "free";
  const status = sub?.status ?? "free";

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
          currentPeriodEnd={sub?.current_period_end ?? null}
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
