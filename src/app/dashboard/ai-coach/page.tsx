import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { AiCoachClient } from "@/components/ai/AiCoachClient";

export default async function AiCoachPage() {
  const user = await requireUser();
  return (
    <AppShell
      title="Money Coach"
      subtitle="Guidance from your logged spending"
      userName={user.name ?? "Student"}
    >
      <AiCoachClient />
    </AppShell>
  );
}
