import { Hero } from "@/components/marketing/hero";
import { StatsBand } from "@/components/marketing/stats-band";
import { WhatForgeReplaces } from "@/components/marketing/what-forge-replaces";
import { Pillars } from "@/components/marketing/pillars";

/**
 * FORGE marketing landing. Forced-dark, whoop/eight-sleep energy.
 *
 * Sections built so far: Hero → Stats band → What FORGE replaces → Five
 * pillars. Pricing, FAQ, and a rebuilt footer are intentionally not here yet.
 */
export default function LandingPage() {
  return (
    <>
      <Hero />
      <StatsBand />
      <WhatForgeReplaces />
      <Pillars />
    </>
  );
}
