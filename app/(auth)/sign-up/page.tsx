import { AuthHeader } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/forms";

export const metadata = { title: "Create account" };

export default function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  void searchParams; // plan intent captured here in a future Stripe wiring session
  return (
    <>
      <AuthHeader
        eyebrow="Create account"
        title="Start your 14-day trial."
        subtitle="No credit card. Cancel any time. Full access to every feature."
      />
      <SignUpForm />
    </>
  );
}
