import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getProfileForUser } from "@/services/profile.service";
import { PersonalityProvider } from "@/components/app/PersonalityProvider";
import { HeaderIdentityProvider } from "@/components/app/HeaderIdentity";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  if (!user.onboardingComplete) {
    redirect("/onboarding");
  }
  const profile = await getProfileForUser(user.id);

  return (
    <PersonalityProvider
      personality={profile?.personalityMode ?? "PROFESSIONAL"}
      theme={profile?.themeMode ?? "SYSTEM"}
      preferredUiLanguage={profile?.preferredUiLanguage}
    >
      <HeaderIdentityProvider
        value={{
          displayName: profile?.displayName ?? null,
          avatarPresetId: profile?.avatarPresetId ?? null,
          avatarStatus: profile?.avatarStatus ?? null,
        }}
      >
        {children}
      </HeaderIdentityProvider>
    </PersonalityProvider>
  );
}
