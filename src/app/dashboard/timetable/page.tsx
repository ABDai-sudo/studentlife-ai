import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { TimetableClient } from "@/components/academics/TimetableClient";

export default async function TimetablePage() {
  const user = await requireUser();
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
