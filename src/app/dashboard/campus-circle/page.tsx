import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { CampusCircleClient } from "@/components/campus/CampusCircleClient";
import { getProfileForUser } from "@/services/profile.service";
import { getCampusCircleOverview } from "@/services/campus-circle.service";
import { features } from "@/lib/features";
import { withDbRetry } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function CampusCirclePage() {
  const user = await requireUser();
  if (!features.campusCircle) {
    redirect("/dashboard");
  }
  const [profile, overview] = await Promise.all([
    getProfileForUser(user.id),
    withDbRetry(() => getCampusCircleOverview(user.id)),
  ]);

  return (
    <AppShell
      title="Campus Circle"
      subtitle="Study connections, invites, and private groups"
      titleKey="circle.title"
      subtitleKey="circle.subtitle"
      userName={user.name ?? "Student"}
      displayName={profile?.displayName}
      avatarPresetId={profile?.avatarPresetId}
      avatarStatus={profile?.resolvedAvatarStatus ?? profile?.avatarStatus}
      avatarPresence={profile?.avatarPresence}
    >
      <CampusCircleClient
        enabled={features.campusCircle}
        initialData={overview}
      />
    </AppShell>
  );
}
