import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { StudyBuddyClient } from "@/components/academics/StudyBuddyClient";
import { getStudyBuddyOverview } from "@/services/study-buddy.service";
import { withDbRetry } from "@/lib/db";

export default async function StudyBuddyPage() {
  const user = await requireUser();
  const overview = await withDbRetry(() =>
    getStudyBuddyOverview(user.id)
  ).catch(() => null);

  return (
    <AppShell
      title="Study Buddy"
      subtitle="What to study now, from your real subjects and deadlines"
      titleKey="buddy.title"
      subtitleKey="buddy.subtitle"
      userName={user.name ?? "Student"}
    >
      <StudyBuddyClient initialData={overview} />
    </AppShell>
  );
}
