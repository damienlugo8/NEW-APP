import Link from "next/link";

/**
 * SECTION 9 — Footer. Forced-dark #0A0A0A, hairline top border. Wordmark
 * left, nav center, copyright right. Collapses to a centered stack on mobile.
 */

const LINKS: { label: string; href: string }[] = [
  { label: "Privacy", href: "/legal/privacy" },
  { label: "Terms", href: "/legal/terms" },
  { label: "Contact", href: "mailto:hello@forge.app" },
  { label: "Press Kit", href: "/press" },
];

export function MarketingFooter() {
  return (
    <footer className="app-footer border-t border-[#2A2A2A] bg-[#0A0A0A]">
      <div className="mx-auto flex max-w-[1100px] flex-col items-center gap-6 px-6 py-10 text-center sm:flex-row sm:justify-between sm:gap-4 sm:text-left">
        {/* Wordmark */}
        <Link
          href="/"
          className="text-[16px] font-semibold uppercase tracking-[0.18em] text-white"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          FORGE
        </Link>

        {/* Links */}
        <nav className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[13px] text-[#6B6B6B]">
          {LINKS.map((l, i) => (
            <span key={l.href} className="flex items-center gap-2">
              {i > 0 && <span className="text-[#3A3A3A]">·</span>}
              <Link
                href={l.href}
                className="transition-colors hover:text-[#A1A1A1]"
              >
                {l.label}
              </Link>
            </span>
          ))}
        </nav>

        {/* Copyright */}
        <p className="text-[13px] text-[#6B6B6B]">
          © 2026 FORGE. Built for the ones who show up.
        </p>
      </div>
    </footer>
  );
}
