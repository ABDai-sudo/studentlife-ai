import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { AssignmentsClient } from "@/components/academics/AssignmentsClient";

export default async function AssignmentsPage() {
  const user = await requireUser();
  return (
    <AppShell title="Homework" subtitle="Due dates and status" userName={user.name ?? "Student"}>
      <AssignmentsClient />
    </AppShell>
  );
}
