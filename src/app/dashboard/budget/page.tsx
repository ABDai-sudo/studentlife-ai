import { PiggyBank } from "lucide-react";
import { ModulePage } from "@/components/app/ModulePage";

export default function BudgetPage() {
  return (
    <ModulePage
      title="Budget"
      subtitle="Pocket money and monthly plan"
      icon={PiggyBank}
      emptyTitle="No budget yet"
      emptyDescription="Add monthly pocket money, fixed costs, and expected savings to unlock safe daily spending."
    />
  );
}
