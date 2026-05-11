import { AuthHeader } from "@/components/auth/auth-shell";

export const metadata = { title: "Verify email" };

export default function VerifyPage() {
  return (
    <>
      <AuthHeader
        eyebrow="Almost there"
        title="Verify your email."
        subtitle="We sent you a link. Click it to finish creating your account. Check spam if it doesn't show up in a minute."
      />
    </>
  );
}
