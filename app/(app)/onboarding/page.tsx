import { OnboardingWizard } from "./wizard";

export const metadata = { title: "Welcome" };

export default function OnboardingPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-start justify-center px-5 lg:px-8 pt-16 sm:pt-24 pb-16">
      <OnboardingWizard />
    </div>
  );
}
