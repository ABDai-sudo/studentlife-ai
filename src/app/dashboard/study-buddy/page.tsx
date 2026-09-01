import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { StudyBuddyClient } from "@/components/academics/StudyBuddyClient";

export default async function StudyBuddyPage() {
  const user = await requireUser();
  return (
    <AppShell
      title="Study Buddy"
      subtitle="What to study now, from your real subjects and deadlines"
      titleKey="buddy.title"
      subtitleKey="buddy.subtitle"
      userName={user.name ?? "Student"}
    >
      <StudyBuddyClient />
    </AppShell>
  );
}
