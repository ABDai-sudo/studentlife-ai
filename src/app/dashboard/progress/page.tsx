import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { ProgressClient } from "@/components/academics/ProgressClient";

export default async function ProgressPage() {
  const user = await requireUser();
  return (
    <AppShell title="Progress" subtitle="Attendance and CGPA" userName={user.name ?? "Student"}>
      <ProgressClient />
    </AppShell>
  );
}
