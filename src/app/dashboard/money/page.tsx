import { Wallet } from "lucide-react";
import { ModulePage } from "@/components/app/ModulePage";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatCard } from "@/components/ui/StatCard";

export default function MoneyDashboardPage() {
  return (
    <ModulePage
      title="Money Dashboard"
      subtitle="Month survival view"
      icon={Wallet}
      emptyTitle="Add your pocket money"
      emptyDescription="Set monthly budget to see money left and safe daily spend."
    >
      <p className="mb-4 text-xs text-muted">
        Placeholder layout until live finance data is connected. Not banking advice.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Money left" value="—" hint="Connect budget" />
        <StatCard label="Days left" value="—" />
        <StatCard label="Safe per day" value="—" />
        <StatCard label="Health score" value="—" />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="card-surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Category budgets</h3>
            <Badge tone="neutral">Ready</Badge>
          </div>
          <ProgressBar value={0} label="Food" className="mb-2" />
          <ProgressBar value={0} label="Travel" tone="accent" />
        </div>
        <div className="card-surface p-5">
          <h3 className="mb-2 text-sm font-semibold">AI Money Coach</h3>
          <p className="text-sm text-secondary">
            Insights appear after you log expenses and set a monthly budget.
          </p>
        </div>
      </div>
    </ModulePage>
  );
}
