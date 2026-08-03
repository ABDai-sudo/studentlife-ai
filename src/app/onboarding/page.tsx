import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OnboardingClient } from "@/components/onboarding/OnboardingClient";

export default async function OnboardingPage() {
  const user = await requireUser();
  if (user.onboardingComplete) {
    redirect("/dashboard");
  }
  return <OnboardingClient />;
}
