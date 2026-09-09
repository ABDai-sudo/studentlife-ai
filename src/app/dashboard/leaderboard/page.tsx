import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { LeaderboardClient } from "@/components/leaderboard/LeaderboardClient";
import { getProfileForUser } from "@/services/profile.service";
import { features } from "@/lib/features";
import { redirect } from "next/navigation";

export default async function LeaderboardPage() {
  const user = await requireUser();
  if (!features.leaderboard) {
    redirect("/dashboard");
  }
  const profile = await getProfileForUser(user.id);

  return (
    <AppShell
      title="Leaderboard"
      subtitle="Optional streak rankings — opt in from Settings"
      titleKey="leaderboard.title"
      subtitleKey="leaderboard.subtitle"
      userName={user.name ?? "Student"}
      displayName={profile?.displayName}
      avatarPresetId={profile?.avatarPresetId}
      avatarImageUrl={profile?.avatarImageUrl}
      avatarStatus={profile?.resolvedAvatarStatus ?? profile?.avatarStatus}
      avatarPresence={profile?.avatarPresence}
    >
      <LeaderboardClient
        optedIn={profile?.leaderboardOptIn ?? false}
        enabled={features.leaderboard}
      />
    </AppShell>
  );
}
