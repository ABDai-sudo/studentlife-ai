import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { ExamPrepClient } from "@/components/academics/ExamPrepClient";
import { getExamPrepWorkflow } from "@/services/exam-prep.service";
import { withDbRetry } from "@/lib/db";

export default async function ExamPrepPage() {
  const user = await requireUser();
  const workflow = await withDbRetry(() => getExamPrepWorkflow(user.id)).catch(
    () => ({
      nextExam: null,
      upcoming: [],
      studyNow: null,
      relatedTasks: [],
      emergencyRecommended: false,
    })
  );
  return (
    <AppShell
      title="Exam Prep"
      subtitle="Revision tools in one place"
      titleKey="examPrep.title"
      subtitleKey="examPrep.subtitle"
      userName={user.name ?? "Student"}
    >
      <ExamPrepClient workflow={workflow} />
    </AppShell>
  );
}
