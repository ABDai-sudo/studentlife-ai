import { Target } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { GoalsClient } from "@/components/goals/GoalsClient";

export default async function GoalsPage() {
  const user = await requireUser();
  return (
    <AppShell
      title="Savings Goals"
      subtitle="Dream purchases with real progress"
      userName={user.name ?? "Student"}
    >
      <div className="mb-4 flex items-center gap-2 text-sm text-secondary">
        <Target className="h-4 w-4 text-primary" />
        Track laptop, course fees, trips, and emergency funds.
      </div>
      <GoalsClient />
    </AppShell>
  );
}
