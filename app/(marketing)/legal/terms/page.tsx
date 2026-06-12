import Link from "next/link";
import { Grain } from "@/components/marketing/grain";

export const metadata = { title: "Terms of Service" };

// TODO(legal): Plain-English placeholder. Have a licensed attorney review and
// replace this with counsel-approved copy before public launch.

const UPDATED = "June 2026";

export default function TermsPage() {
  return (
    <div className="relative min-h-[70vh] overflow-hidden bg-[#0A0A0A] px-6 py-24">
      <Grain opacity={0.06} />
      <article className="relative z-10 mx-auto max-w-[680px]">
        <p
          className="text-[12px] uppercase tracking-[0.15em] text-[#FF6B1A]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Legal
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
          Terms of Service
        </h1>
        <p
          className="mt-3 text-[13px] text-[#8B877E]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Last updated: {UPDATED}
        </p>

        <p className="mt-8 text-[16px] leading-[1.7] text-[#A1A1A1]">
          By creating a FORGE account or using the app, you agree to these terms.
          If you don&apos;t agree, don&apos;t use FORGE. We keep this short and
          plain on purpose.
        </p>

        <Section title="The service">
          <P>
            FORGE is a discipline and habit app: daily check-ins, a 75 Hard
            companion, AI-assisted nutrition, screen-time tools, and squad
            accountability. We may add, change, or remove features as the product
            evolves. FORGE is a tool for self-improvement, not medical, fitness,
            or mental-health advice — use common sense and consult a professional
            before starting any new fitness or diet program.
          </P>
        </Section>

        <Section title="Your account">
          <P>
            You&apos;re responsible for your account and for keeping your login
            secure. One person per account — don&apos;t share credentials. You
            must be at least 18 to use FORGE. You own the content you create
            (habits, journals, photos); you grant us the limited rights needed to
            store and display it back to you and your squad.
          </P>
        </Section>

        <Section title="Subscriptions & billing">
          <P>
            FORGE offers a free tier, a paid Pro plan (monthly or annual), and a
            one-time Lifetime purchase. Paid plans are billed through Stripe. Pro
            includes a 14-day free trial; if you don&apos;t cancel before the
            trial ends, the plan renews and your card is charged. Subscriptions
            renew automatically until cancelled.
          </P>
        </Section>

        <Section title="Cancellation & refunds">
          <P>
            Cancel anytime from your billing settings — no questions asked. Your
            access continues through the end of the period you&apos;ve already
            paid for, and you won&apos;t be charged again. We don&apos;t
            pro-rate partial months. Lifetime purchases and past charges are
            non-refundable except where the law requires otherwise.
          </P>
        </Section>

        <Section title="Acceptable use">
          <P>
            Don&apos;t abuse the service: no attempts to break, scrape, or
            overload it; no uploading content that isn&apos;t yours or that
            violates the law; no harassment of other members through squad
            features. We may suspend or close accounts that break these rules.
          </P>
        </Section>

        <Section title="Disclaimers & liability">
          <P>
            FORGE is provided &ldquo;as is.&rdquo; We work hard to keep it running
            but can&apos;t guarantee it will be uninterrupted or error-free, and
            we&apos;re not liable for outcomes related to your fitness, diet, or
            personal goals. To the extent the law allows, our total liability is
            limited to the amount you paid us in the prior 12 months.
          </P>
        </Section>

        <Section title="Changes & contact">
          <P>
            We may update these terms; we&apos;ll change the date above and, for
            material changes, give notice in-app or by email. Continued use means
            you accept the updated terms. Questions? Email{" "}
            <a href="mailto:hello@forge.app" className="text-[#FF6B1A] hover:underline">
              hello@forge.app
            </a>
            .
          </P>
        </Section>

        <p
          className="mt-12 border-t border-[#2A2A2A] pt-6 text-[13px] text-[#8B877E]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Placeholder document — pending attorney review before launch.{" "}
          <Link href="/" className="text-[#A1A1A1] hover:text-white">
            Back to home
          </Link>
        </p>
      </article>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2
        className="text-white"
        style={{
          fontFamily: "var(--font-serif)",
          fontWeight: 500,
          fontSize: "1.5rem",
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-[16px] leading-[1.7] text-[#A1A1A1]">{children}</p>;
}
