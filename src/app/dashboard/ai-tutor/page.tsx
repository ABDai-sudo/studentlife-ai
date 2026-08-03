import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { AiTutorClient } from "@/components/academics/AiTutorClient";

export default async function AiTutorPage() {
  const user = await requireUser();
  return (
    <AppShell
      title="Study Tutor"
      subtitle="Ask study questions in simple words"
      userName={user.name ?? "Student"}
    >
      <AiTutorClient />
    </AppShell>
  );
}
