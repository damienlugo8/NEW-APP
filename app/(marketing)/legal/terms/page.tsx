export const metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-[68ch] px-6 md:px-10 py-24 md:py-32">
      <p className="t-caption text-[var(--text-subtle)] mb-5">Legal</p>
      <h1 className="t-h1">Terms</h1>
      <p className="t-body-lg text-[var(--text-muted)] mt-6">
        By using NotaryFlow, you agree to these terms. NotaryFlow is a tool for your
        business; you remain the notary of record for every signing, and you are
        responsible for compliance with your state&apos;s notary law.
      </p>
      <h2 className="t-h2 mt-12">Subscription</h2>
      <p className="t-body mt-3 text-[var(--text-muted)]">
        Plans renew monthly. Cancel any time from the billing settings — your access
        continues through the end of the paid period.
      </p>
      <h2 className="t-h2 mt-10">Acceptable use</h2>
      <p className="t-body mt-3 text-[var(--text-muted)]">
        Don&apos;t use the product to store data that doesn&apos;t belong to you, and
        don&apos;t share login credentials. One person, one account.
      </p>
      <p className="t-small text-[var(--text-subtle)] mt-10 font-mono">
        Placeholder document — replace with counsel-reviewed copy before launch.
      </p>
    </article>
  );
}
