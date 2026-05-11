import { AuthHeader } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/forms";

export const metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <>
      <AuthHeader eyebrow="Welcome back" title="Log in to NotaryFlow." />
      <LoginForm />
    </>
  );
}
