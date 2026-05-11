export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-[68ch] px-6 md:px-10 py-24 md:py-32">
      <p className="t-caption text-[var(--text-subtle)] mb-5">Legal</p>
      <h1 className="t-h1">Privacy</h1>
      <p className="t-body-lg text-[var(--text-muted)] mt-6">
        NotaryFlow stores three kinds of sensitive data: your identity (full name,
        commission), the signers you record in your journal, and your billing.
        We treat each one with the care state notary law requires.
      </p>
      <h2 className="t-h2 mt-12">What we store</h2>
      <p className="t-body mt-3 text-[var(--text-muted)]">
        Account data, journal entries you create, and a Stripe customer record once
        you start billing. We do not sell data and do not run ad tracking.
      </p>
      <h2 className="t-h2 mt-10">Data deletion</h2>
      <p className="t-body mt-3 text-[var(--text-muted)]">
        Email <a className="text-[var(--accent)]" href="mailto:hello@notaryflow.app">hello@notaryflow.app</a>{" "}
        from your account address and we will export and delete your data within 30 days.
        Journal entries you are legally required to retain are exported, not destroyed.
      </p>
      <p className="t-small text-[var(--text-subtle)] mt-10 font-mono">
        Placeholder document — replace with counsel-reviewed copy before launch.
      </p>
    </article>
  );
}
