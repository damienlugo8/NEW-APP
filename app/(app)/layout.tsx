import { redirect } from "next/navigation";
import { Sidebar } from "@/components/app/sidebar";
import { TopBar } from "@/components/app/topbar";
import { MobileNav } from "@/components/app/mobile-nav";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import { ConfigureBanner } from "@/components/app/configure-banner";

/**
 * Film-grain overlay for the app shell — same fractal-noise texture as the
 * marketing <Grain>, replicated here with `fixed` positioning so it covers
 * the whole viewport. At 5% it reads as iron grain on dark and paper grain
 * on light. pointer-events-none, so it never blocks interaction.
 */
const NOISE =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")";

function GrainOverlay() {
  return (
    <span
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 print:hidden"
      style={{
        opacity: 0.05,
        backgroundImage: NOISE,
        mixBlendMode: "overlay",
      }}
    />
  );
}

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
        <GrainOverlay />
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
      <GrainOverlay />
    </div>
  );
}
