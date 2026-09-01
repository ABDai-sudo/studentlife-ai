import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { AiCoachClient } from "@/components/ai/AiCoachClient";
import { getProfileForUser } from "@/services/profile.service";
import { getMoneyAssistantCopy } from "@/lib/personality";

export default async function AiCoachPage() {
  const user = await requireUser();
  const profile = await getProfileForUser(user.id);
  const assistant = getMoneyAssistantCopy(
    profile?.personalityMode ?? "PROFESSIONAL"
  );

  return (
    <AppShell
      title={assistant.name}
      subtitle={assistant.subtitle}
      titleKey="money.coachTitle"
      userName={user.name ?? "Student"}
    >
      <AiCoachClient />
    </AppShell>
  );
}
