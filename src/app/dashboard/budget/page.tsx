import { PiggyBank } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { BudgetsClient } from "@/components/budget/BudgetsClient";

export default async function BudgetPage() {
  const user = await requireUser();
  return (
    <AppShell
      title="Budget"
      subtitle="Category limits for this month"
      userName={user.name ?? "Student"}
    >
      <div className="mb-4 flex items-center gap-2 text-sm text-secondary">
        <PiggyBank className="h-4 w-4 text-primary" />
        Set monthly limits and compare against logged expenses.
      </div>
      <BudgetsClient />
    </AppShell>
  );
}
