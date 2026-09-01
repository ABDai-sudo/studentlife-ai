import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { AssignmentHelperClient } from "@/components/academics/AssignmentHelperClient";

export default async function AssignmentHelperPage() {
  const user = await requireUser();
  return (
    <AppShell
      title="Assignment Helper"
      subtitle="Guided drafts that help you learn"
      userName={user.name ?? "Student"}
    >
      <AssignmentHelperClient />
    </AppShell>
  );
}
