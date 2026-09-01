import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { AiTutorClient } from "@/components/academics/AiTutorClient";

export default async function AiTutorPage() {
  const user = await requireUser();
  return (
    <AppShell
      title="AI Tutor"
      subtitle="Personalized study help with saved conversations"
      titleKey="tutor.title"
      subtitleKey="tutor.subtitle"
      userName={user.name ?? "Student"}
    >
      <AiTutorClient />
    </AppShell>
  );
}
