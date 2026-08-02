import { Wallet } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { ExpensesClient } from "@/components/expenses/ExpensesClient";
import { trackAnalyticsEvent } from "@/services/analytics.service";

export default async function ExpensesPage() {
  const user = await requireUser();
  void trackAnalyticsEvent({ eventName: "expense_module_opened" }, user.id);

  return (
    <AppShell
      title="Expenses"
      subtitle="Log and categorize spending"
      userName={user.name ?? "Student"}
    >
      <div className="mb-4 flex items-start gap-3">
        <div className="rounded-xl bg-primary-soft p-2 text-primary">
          <Wallet className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            Track real spending
          </p>
          <p className="text-sm text-muted">
            Entries are saved to your account and used for monthly totals.
          </p>
        </div>
      </div>
      <ExpensesClient />
    </AppShell>
  );
}
