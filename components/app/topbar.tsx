"use client";

import { signOutAction } from "@/app/auth/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function TopBar({ email }: { email: string }) {
  return (
    <header className="h-16 border-b border-[var(--border)] bg-[var(--bg)] flex items-center justify-between px-5 lg:px-8">
      <div className="text-sm text-[var(--text-muted)]">
        <span className="hidden sm:inline">Signed in as </span>
        <span className="font-mono text-[var(--text)]">{email}</span>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <form action={signOutAction}>
          <Button variant="ghost" size="sm" type="submit">
            <LogOut size={14} strokeWidth={1.75} />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </form>
      </div>
    </header>
  );
}
