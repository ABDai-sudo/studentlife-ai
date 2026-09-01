import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { ClassHubClient } from "@/components/academics/ClassHubClient";

export default async function ClassHubPage() {
  const user = await requireUser();
  return (
    <AppShell
      title="Class Hub"
      subtitle="Optional class community"
      userName={user.name ?? "Student"}
    >
      <ClassHubClient />
    </AppShell>
  );
}
