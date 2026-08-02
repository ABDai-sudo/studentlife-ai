import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { LogoutButton } from "@/components/app/LogoutButton";

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <AppShell
      title="Settings"
      subtitle="Account preferences"
      userName={user.name ?? "Student"}
    >
      <div className="max-w-xl space-y-4">
        <section className="card-surface p-5">
          <h2 className="text-sm font-semibold text-foreground">Preferences</h2>
          <p className="mt-2 text-sm text-secondary">
            Theme, notifications, and language settings will arrive in a later
            phase. Your account and security settings remain available now.
          </p>
        </section>

        <section className="card-surface p-5">
          <h2 className="text-sm font-semibold text-foreground">Session</h2>
          <p className="mt-2 text-sm text-secondary">
            Sign out of StudentLife AI on this device.
          </p>
          <div className="mt-4">
            <LogoutButton />
          </div>
        </section>
      </div>
    </AppShell>
  );
}
