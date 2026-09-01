import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { EmergencyPlanClient } from "@/components/academics/EmergencyPlanClient";

export default async function EmergencyPage() {
  const user = await requireUser();
  return (
    <AppShell
      title="Emergency Study Plan"
      subtitle="Realistic now / next / later schedule"
      titleKey="emergency.title"
      subtitleKey="emergency.subtitle"
      userName={user.name ?? "Student"}
    >
      <EmergencyPlanClient />
    </AppShell>
  );
}
