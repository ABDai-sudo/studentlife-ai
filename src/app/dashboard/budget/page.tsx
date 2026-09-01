import { CircleDollarSign } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { BudgetsClient } from "@/components/budget/BudgetsClient";
import { getProfileForUser } from "@/services/profile.service";
import { getMoneyAssistantCopy } from "@/lib/personality";

export default async function BudgetPage() {
  const user = await requireUser();
  const profile = await getProfileForUser(user.id);
  const assistant = getMoneyAssistantCopy(
    profile?.personalityMode ?? "PROFESSIONAL"
  );

  return (
    <AppShell
      title="Budget"
      subtitle="Category limits for this month"
      titleKey="budget.title"
      subtitleKey="budget.subtitle"
      userName={user.name ?? "Student"}
    >
      <div className="mb-4 flex items-start gap-2 text-sm leading-relaxed text-secondary">
        <CircleDollarSign className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <span className="min-w-0">{assistant.budgetHint}</span>
      </div>
      <BudgetsClient />
    </AppShell>
  );
}
