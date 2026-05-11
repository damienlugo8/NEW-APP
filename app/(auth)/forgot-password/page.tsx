import { AuthHeader } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forms";

export const metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <AuthHeader
        eyebrow="Reset password"
        title="We'll email you a reset link."
        subtitle="Enter the email tied to your NotaryFlow account."
      />
      <ForgotPasswordForm />
    </>
  );
}
