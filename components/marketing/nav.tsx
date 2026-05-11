"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-colors duration-200",
        scrolled
          ? "bg-[color-mix(in_oklab,var(--bg)_88%,transparent)] backdrop-blur-md border-b border-[var(--border)]"
          : "bg-transparent border-b border-transparent"
      )}
    >
      <div className="mx-auto max-w-[1200px] px-6 md:px-10 h-16 flex items-center justify-between">
        <Link href="/" className="text-[var(--text)]">
          <Logo />
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-[var(--text-muted)]">
          <a href="#why" className="hover:text-[var(--text)] transition-colors">Why switch</a>
          <a href="#pipeline" className="hover:text-[var(--text)] transition-colors">Pipeline</a>
          <a href="#pricing" className="hover:text-[var(--text)] transition-colors">Pricing</a>
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle className="hidden sm:inline-flex" />
          <Link href="/login" className="hidden sm:inline-flex text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
            Log in
          </Link>
          <Link href="/sign-up">
            <Button size="sm">Start free trial</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
