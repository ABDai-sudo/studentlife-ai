import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { SubjectsClient } from "@/components/academics/SubjectsClient";

export default async function SubjectsPage() {
  const user = await requireUser();
  return (
    <AppShell
      title="Subjects"
      subtitle="Your subjects this term"
      titleKey="nav.subjects"
      userName={user.name ?? "Student"}
    >
      <SubjectsClient />
    </AppShell>
  );
}
