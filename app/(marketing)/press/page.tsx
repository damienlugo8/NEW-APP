import Link from "next/link";
import { Grain } from "@/components/marketing/grain";

export const metadata = { title: "Press Kit" };

/**
 * Minimal press kit placeholder — keeps the footer link live. Forced-dark to
 * match the rebuilt landing. Expand with logos/screenshots/boilerplate later.
 */
export default function PressPage() {
  return (
    <div className="relative min-h-[70vh] overflow-hidden bg-[#0A0A0A] px-6 py-24">
      <Grain opacity={0.06} />
      <div className="relative z-10 mx-auto max-w-[680px]">
        <p
          className="text-[12px] uppercase tracking-[0.15em] text-[#FF6B1A]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Press Kit
        </p>
        <h1
          className="mt-4 text-white"
          style={{
            fontFamily: "var(--font-serif)",
            fontWeight: 500,
            fontSize: "clamp(2rem, 5vw, 3rem)",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
          }}
        >
          FORGE in the press.
        </h1>
        <p className="mt-5 max-w-[520px] text-[17px] leading-[1.6] text-[#A1A1A1]">
          The operating system for discipline. Built for men who are done being
          soft — daily habits, a 75 Hard companion, AI nutrition, screen-time
          control, and a five-man accountability squad.
        </p>

        <dl className="mt-10 space-y-6 border-t border-[#2A2A2A] pt-8">
          <div>
            <dt
              className="text-[12px] uppercase tracking-[0.12em] text-[#8B877E]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Tagline
            </dt>
            <dd className="mt-1 text-[16px] text-white">Forge yourself. Daily.</dd>
          </div>
          <div>
            <dt
              className="text-[12px] uppercase tracking-[0.12em] text-[#8B877E]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Media inquiries
            </dt>
            <dd className="mt-1 text-[16px]">
              <a
                href="mailto:press@forge.app"
                className="text-[#FF6B1A] hover:underline"
              >
                press@forge.app
              </a>
            </dd>
          </div>
        </dl>

        <p className="mt-12 text-[14px] text-[#8B877E]">
          Logos, screenshots, and boilerplate are on the way.{" "}
          <Link href="/" className="text-[#A1A1A1] hover:text-white">
            Back to home
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
