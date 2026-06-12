import Link from "next/link";
import { Grain } from "@/components/marketing/grain";

export const metadata = { title: "Privacy Policy" };

// TODO(legal): Plain-English placeholder. Have a licensed attorney review and
// replace this with counsel-approved copy before public launch.

const UPDATED = "June 2026";

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p
          className="mt-3 text-[13px] text-[#8B877E]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Last updated: {UPDATED}
        </p>

        <p className="mt-8 text-[16px] leading-[1.7] text-[#A1A1A1]">
          FORGE is a discipline app. To run it we collect the minimum we need to
          give you an account, track your progress, and bill you. We don&apos;t
          sell your data and we don&apos;t run ad trackers. This page explains, in
          plain English, what we hold and what you can do about it.
        </p>

        <Section title="What we collect">
          <P>
            <strong className="text-white">Account data</strong> — your email,
            and the name you choose. We use email and a hashed password (or a
            magic link) to sign you in.
          </P>
          <P>
            <strong className="text-white">Activity data</strong> — the habits
            you log, your 75 Hard progress, nutrition photos and entries, screen
            blocks, journal entries, and your squad membership. This is the
            product; without it FORGE can&apos;t show you anything.
          </P>
          <P>
            <strong className="text-white">Billing data</strong> — if you
            subscribe, Stripe handles your card. We store a customer reference
            and your plan status. We never see or store full card numbers.
          </P>
          <P>
            <strong className="text-white">Marketing email</strong> — if you ask
            for the FORGE Protocol guide, we store that email so we can send it
            and follow up.
          </P>
        </Section>

        <Section title="How we use it">
          <P>
            To run your account, show your progress and streaks, power features
            like AI nutrition analysis and squad accountability, process your
            subscription, send transactional email (sign-in, receipts, the guide
            you requested), and improve the product. We do not use your data to
            build advertising profiles.
          </P>
        </Section>

        <Section title="Third parties we share with">
          <P>
            We rely on a short list of vendors to operate. Each only receives
            what it needs to do its job:
          </P>
          <ul className="mt-3 space-y-2 text-[16px] leading-[1.6] text-[#A1A1A1]">
            <Li>
              <strong className="text-white">Supabase</strong> — database, auth,
              and file storage. Holds your account and activity data.
            </Li>
            <Li>
              <strong className="text-white">Stripe</strong> — payment
              processing. Holds your billing details under its own privacy
              policy.
            </Li>
            <Li>
              <strong className="text-white">Resend</strong> — transactional and
              marketing email delivery. Receives your email address to send mail
              you&apos;ve opted into.
            </Li>
          </ul>
          <P>
            We may also disclose data if required by law. We don&apos;t sell your
            data to anyone.
          </P>
        </Section>

        <Section title="Your rights">
          <P>
            You can access, correct, export, or delete your data at any time.
            Email{" "}
            <a href="mailto:hello@forge.app" className="text-[#FF6B1A] hover:underline">
              hello@forge.app
            </a>{" "}
            from your account address and we&apos;ll respond within 30 days.
            Deleting your account removes your activity data; some records (like
            billing history) may be retained where the law requires it.
          </P>
        </Section>

        <Section title="Data retention & security">
          <P>
            We keep your data while your account is active and for a reasonable
            period after, then delete or anonymize it. Access is restricted,
            traffic is encrypted in transit, and progress photos are private —
            served only through short-lived signed links.
          </P>
        </Section>

        <Section title="Contact">
          <P>
            Questions about privacy? Email{" "}
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

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="relative pl-5 before:absolute before:left-0 before:top-[0.6em] before:h-[5px] before:w-[5px] before:rounded-full before:bg-[#FF6B1A]">
      {children}
    </li>
  );
}
