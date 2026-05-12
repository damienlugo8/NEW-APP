import { Hero } from "@/components/marketing/hero";
import { WhySwitch } from "@/components/marketing/why-switch";
import { Features } from "@/components/marketing/features";
import { Pricing } from "@/components/marketing/pricing";
import { FAQ } from "@/components/marketing/faq";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <WhySwitch />
      <Features />
      <Pricing />
      <FAQ />
    </>
  );
}
