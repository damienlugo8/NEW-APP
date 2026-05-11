"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  signUpAction,
  loginAction,
  forgotPasswordAction,
  resetPasswordAction,
  type AuthState,
} from "@/app/auth/actions";

const initial: AuthState = {};

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUpAction, initial);
  if (state.ok) {
    return (
      <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-6">
        <p className="t-caption text-[var(--accent)] mb-2">Check your inbox</p>
        <h3 className="t-h3 mb-2">We sent you a verification link.</h3>
        <p className="text-sm text-[var(--text-muted)]">
          Click the link in the email to finish creating your account. The link
          expires in 24 hours.
        </p>
      </div>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-4">
      <Input name="email" type="email" label="Email" autoComplete="email" required />
      <Input
        name="password"
        type="password"
        label="Password"
        autoComplete="new-password"
        helper="At least 10 characters."
        required
        minLength={10}
      />
      {state.error && <p className="text-sm text-[var(--danger)]">{state.error}</p>}
      <Button type="submit" loading={pending} className="w-full mt-2">
        Create account
      </Button>
      <p className="text-sm text-[var(--text-muted)] text-center">
        Already have an account?{" "}
        <Link href="/login" className="text-[var(--text)] underline underline-offset-4">
          Log in
        </Link>
      </p>
    </form>
  );
}

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initial);
  return (
    <form action={action} className="flex flex-col gap-4">
      <Input name="email" type="email" label="Email" autoComplete="email" required />
      <Input
        name="password"
        type="password"
        label="Password"
        autoComplete="current-password"
        required
      />
      {state.error && <p className="text-sm text-[var(--danger)]">{state.error}</p>}
      <Button type="submit" loading={pending} className="w-full mt-2">
        Log in
      </Button>
      <div className="flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="text-[var(--text-muted)] hover:text-[var(--text)]">
          Forgot password?
        </Link>
        <Link href="/sign-up" className="text-[var(--text-muted)] hover:text-[var(--text)]">
          Create account
        </Link>
      </div>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, initial);
  if (state.ok) {
    return (
      <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-6">
        <p className="t-caption text-[var(--accent)] mb-2">Check your inbox</p>
        <h3 className="t-h3 mb-2">If an account exists, a reset link is on its way.</h3>
        <p className="text-sm text-[var(--text-muted)]">
          The link expires in 1 hour.
        </p>
      </div>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-4">
      <Input name="email" type="email" label="Email" autoComplete="email" required />
      {state.error && <p className="text-sm text-[var(--danger)]">{state.error}</p>}
      <Button type="submit" loading={pending} className="w-full mt-2">
        Send reset link
      </Button>
      <p className="text-sm text-[var(--text-muted)] text-center">
        <Link href="/login" className="hover:text-[var(--text)]">
          Back to login
        </Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(resetPasswordAction, initial);
  return (
    <form action={action} className="flex flex-col gap-4">
      <Input
        name="password"
        type="password"
        label="New password"
        autoComplete="new-password"
        helper="At least 10 characters."
        required
        minLength={10}
      />
      {state.error && <p className="text-sm text-[var(--danger)]">{state.error}</p>}
      <Button type="submit" loading={pending} className="w-full mt-2">
        Set new password
      </Button>
    </form>
  );
}
