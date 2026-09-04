import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { TimetableClient } from "@/components/academics/TimetableClient";
import { trackAnalyticsEvent } from "@/services/analytics.service";

export default async function TimetablePage() {
  const user = await requireUser();
  void trackAnalyticsEvent({ eventName: "timetable_opened" }, user.id);
  return (
    <AppShell
      title="Timetable"
      subtitle="Weekly class schedule"
      titleKey="nav.timetable"
      userName={user.name ?? "Student"}
    >
      <TimetableClient />
    </AppShell>
  );
}
