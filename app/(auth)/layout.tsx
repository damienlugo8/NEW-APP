import Link from "next/link";
import { Logo } from "@/components/brand/logo";

/**
 * Two-pane auth shell. Left is editorial (collapsed below lg). The headline
 * mixes a serif italic accent into a sans setting — same idiom we use on the
 * dashboard greeting, so the brand voice carries across the seam from
 * marketing → app.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr]">
      {/* Left — editorial pane. brand-wash adds the radial accent tint. */}
      <aside className="hidden lg:flex flex-col justify-between p-12 border-r border-[var(--border)] brand-wash relative overflow-hidden">
        {/* Faint decorative seal in the bottom-right corner */}
        <svg
          aria-hidden
          className="absolute -right-24 -bottom-24 w-[420px] h-[420px] text-[var(--accent)] opacity-[0.06] pointer-events-none"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="0.6" />
          <circle cx="12" cy="12" r="6.5" stroke="currentColor" strokeWidth="0.4" />
          <path
            d="M7.5 13.5 L11 16 L16.5 9.5"
            stroke="currentColor"
            strokeWidth="0.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <Link href="/" className="text-[var(--text)] relative z-10">
          <Logo />
        </Link>

        <div className="max-w-[44ch] relative z-10">
          <p className="t-caption text-[var(--accent)] mb-5">For solo mobile notaries</p>
          <h1 className="t-h1 leading-[1.04] text-[var(--text)]">
            <span className="font-serif italic text-[var(--text-muted)]">
              Stop chasing
            </span>
            <br />
            title companies in a spreadsheet.
          </h1>
          <p className="t-body-lg text-[var(--text-muted)] mt-6">
            NotaryFlow keeps your journal, signings, and outreach in one place —
            and tells you which company is worth driving to next.
          </p>

          {/* Quiet credibility — three short proofs, not a testimonial wall */}
          <ul className="mt-10 flex flex-col gap-3 text-sm">
            {[
              "Locked, searchable journal entries.",
              "One-tap nav to every signing.",
              "Pipeline that nudges you before contacts go cold.",
            ].map((line) => (
              <li
                key={line}
                className="flex items-start gap-3 text-[var(--text-muted)]"
              >
                <span
                  className="mt-2 h-1 w-1 rounded-full bg-[var(--text-subtle)] shrink-0"
                  aria-hidden
                />
                {line}
              </li>
            ))}
          </ul>
        </div>

        <p className="t-caption t-num text-[var(--text-subtle)] relative z-10">
          © {new Date().getFullYear()} NotaryFlow
        </p>
      </aside>

      <main className="flex flex-col px-6 sm:px-10 py-10">
        <Link
          href="/"
          className="lg:hidden text-[var(--text)] self-start inline-flex min-h-11 items-center"
        >
          <Logo />
        </Link>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>
      </main>
    </div>
  );
}
