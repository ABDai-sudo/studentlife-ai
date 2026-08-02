import { Target } from "lucide-react";
import { ModulePage } from "@/components/app/ModulePage";

export default function GoalsPage() {
  return (
    <ModulePage
      title="Savings Goals"
      subtitle="Laptop, course, trip, emergency fund"
      icon={Target}
      emptyTitle="No savings goals yet"
      emptyDescription="Add a dream purchase or emergency fund. Track target amount, weekly savings, and estimated date."
    />
  );
}
