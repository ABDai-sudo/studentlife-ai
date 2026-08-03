import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { SettingsClient } from "@/components/settings/SettingsClient";

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <AppShell
      title="Settings"
      subtitle="Account, preferences, and privacy"
      userName={user.name ?? "Student"}
    >
      <SettingsClient
        email={user.email}
        name={user.name}
        plan={user.plan}
      />
    </AppShell>
  );
}
