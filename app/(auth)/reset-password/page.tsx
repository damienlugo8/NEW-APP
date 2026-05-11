import { AuthHeader } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/forms";

export const metadata = { title: "Set new password" };

export default function ResetPasswordPage() {
  return (
    <>
      <AuthHeader eyebrow="New password" title="Choose a new password." />
      <ResetPasswordForm />
    </>
  );
}
