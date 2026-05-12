import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export function MarketingFooter() {
  return (
    <footer className="mt-32 border-t border-[var(--border)]">
      <div className="mx-auto max-w-[1200px] px-6 md:px-10 py-16 grid gap-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 text-sm text-[var(--text-muted)] max-w-[28ch]">
            The signing business platform built for solo mobile notaries in the United States.
          </p>
        </div>
        <FooterCol title="Product">
          <FooterLink href="#features">Features</FooterLink>
          <FooterLink href="#pricing">Pricing</FooterLink>
          <FooterLink href="#faq">FAQ</FooterLink>
        </FooterCol>
        <FooterCol title="Company">
          <FooterLink href="/legal/privacy">Privacy</FooterLink>
          <FooterLink href="/legal/terms">Terms</FooterLink>
          <FooterLink href="mailto:hello@notaryflow.app">Contact</FooterLink>
        </FooterCol>
        <FooterCol title="Account">
          <FooterLink href="/login">Log in</FooterLink>
          <FooterLink href="/sign-up">Sign up</FooterLink>
        </FooterCol>
      </div>
      <div className="border-t border-[var(--border)]">
        <div className="mx-auto max-w-[1200px] px-6 md:px-10 py-6 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between text-xs text-[var(--text-subtle)]">
          <span>© {new Date().getFullYear()} NotaryFlow, Inc.</span>
          <span className="font-mono">v0.1 · foundation</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="t-caption text-[var(--text-subtle)] mb-3">{title}</p>
      <ul className="flex flex-col gap-2 text-sm">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
        {children}
      </Link>
    </li>
  );
}
