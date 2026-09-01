import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { QuestionGeneratorClient } from "@/components/academics/QuestionGeneratorClient";

export default async function QuestionGeneratorPage() {
  const user = await requireUser();
  return (
    <AppShell
      title="Question Generator"
      subtitle="Build practice papers from your topics"
      titleKey="questionGen.title"
      subtitleKey="questionGen.subtitle"
      userName={user.name ?? "Student"}
    >
      <QuestionGeneratorClient />
    </AppShell>
  );
}
