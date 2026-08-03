import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { ExamsClient } from "@/components/academics/ExamsClient";

export default async function ExamsPage() {
  const user = await requireUser();
  return (
    <AppShell title="Exams" subtitle="Upcoming tests and dates" userName={user.name ?? "Student"}>
      <ExamsClient />
    </AppShell>
  );
}
