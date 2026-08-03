import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { ProfileClient } from "@/components/profile/ProfileClient";

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <AppShell
      title="Profile"
      subtitle="Your account and money settings"
      userName={user.name ?? "Student"}
    >
      <ProfileClient email={user.email} name={user.name} plan={user.plan} />
    </AppShell>
  );
}
