import { Hero } from "@/components/marketing/hero";
import { StatsBand } from "@/components/marketing/stats-band";
import { WhatForgeReplaces } from "@/components/marketing/what-forge-replaces";
import { Pillars } from "@/components/marketing/pillars";
import { BuiltFor75 } from "@/components/marketing/built-for-75";
import { Pricing } from "@/components/marketing/pricing";
import { FAQ } from "@/components/marketing/faq";
import { FinalCta } from "@/components/marketing/final-cta";

/**
 * FORGE marketing landing. Forced-dark, whoop/eight-sleep energy.
 *
 * Hero → Stats → What FORGE replaces → Five pillars → Built for 75 Hard →
 * Pricing → FAQ → Final CTA. Footer + sticky Protocol banner live in the
 * marketing layout.
 */
export default function LandingPage() {
  return (
    <>
      <Hero />
      <StatsBand />
      <WhatForgeReplaces />
      <Pillars />
      <BuiltFor75 />
      <Pricing />
      <FAQ />
      <FinalCta />
    </>
  );
}
