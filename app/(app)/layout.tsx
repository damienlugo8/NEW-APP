import { redirect } from "next/navigation";
import { Sidebar } from "@/components/app/sidebar";
import { TopBar } from "@/components/app/topbar";
import { MobileNav } from "@/components/app/mobile-nav";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import { ConfigureBanner } from "@/components/app/configure-banner";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // If Supabase isn't wired yet, let the user in but show a banner with
  // setup instructions so they can browse the design.
  if (!supabaseConfigured) {
    return (
      <div className="min-h-screen flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <TopBar email="not-configured@localhost" />
          <ConfigureBanner />
          <main className="flex-1">{children}</main>
        </div>
        <MobileNav />
      </div>
    );
  }

  const sb = await supabaseServer();
  const { data } = await sb!.auth.getUser();
  if (!data.user) redirect("/login");

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar email={data.user.email ?? ""} />
        <main className="flex-1">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
