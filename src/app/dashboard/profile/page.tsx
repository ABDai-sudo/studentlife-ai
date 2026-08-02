import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <AppShell
      title="Profile"
      subtitle="Your account details"
      userName={user.name ?? "Student"}
    >
      <div className="max-w-xl card-surface p-5 sm:p-6">
        <dl className="space-y-4 text-sm">
          <div>
            <dt className="text-muted">Name</dt>
            <dd className="mt-1 font-medium text-foreground">
              {user.name ?? "Not set"}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Email</dt>
            <dd className="mt-1 font-medium text-foreground">{user.email}</dd>
          </div>
          <div>
            <dt className="text-muted">Plan</dt>
            <dd className="mt-1 font-medium text-foreground">{user.plan}</dd>
          </div>
          <div>
            <dt className="text-muted">Onboarding</dt>
            <dd className="mt-1 font-medium text-foreground">
              {user.onboardingComplete ? "Complete" : "Pending"}
            </dd>
          </div>
        </dl>
      </div>
    </AppShell>
  );
}
