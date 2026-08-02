import { ChartColumn } from "lucide-react";
import { ModulePage } from "@/components/app/ModulePage";

export default function ReportsPage() {
  return (
    <ModulePage
      title="Reports"
      subtitle="Weekly and monthly money reviews"
      icon={ChartColumn}
      emptyTitle="No reports yet"
      emptyDescription="After you log expenses, weekly and monthly spending summaries will appear here."
    />
  );
}
