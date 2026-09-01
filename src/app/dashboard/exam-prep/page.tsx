import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { ExamPrepClient } from "@/components/academics/ExamPrepClient";

export default async function ExamPrepPage() {
  const user = await requireUser();
  return (
    <AppShell
      title="Exam Prep"
      subtitle="Revision tools in one place"
      titleKey="examPrep.title"
      subtitleKey="examPrep.subtitle"
      userName={user.name ?? "Student"}
    >
      <ExamPrepClient />
    </AppShell>
  );
}
