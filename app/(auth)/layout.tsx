import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr]">
      {/* Left — editorial pane. On mobile this collapses to a slim header. */}
      <aside className="hidden lg:flex flex-col justify-between p-12 border-r border-[var(--border)] bg-[var(--surface-2)]">
        <Link href="/" className="text-[var(--text)]">
          <Logo />
        </Link>
        <div className="max-w-[44ch]">
          <p className="t-caption text-[var(--accent)] mb-4">For solo mobile notaries</p>
          <h1 className="t-h1 leading-[1.05]">
            Stop chasing title companies in a spreadsheet.
          </h1>
          <p className="t-body-lg text-[var(--text-muted)] mt-6">
            NotaryFlow keeps your journal, signings, and outreach in one place — and
            tells you which company is worth driving to next.
          </p>
        </div>
        <p className="text-xs text-[var(--text-subtle)] font-mono uppercase tracking-wider">
          © {new Date().getFullYear()} NotaryFlow
        </p>
      </aside>

      <main className="flex flex-col px-6 sm:px-10 py-10">
        <Link href="/" className="lg:hidden text-[var(--text)] self-start">
          <Logo />
        </Link>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>
      </main>
    </div>
  );
}
