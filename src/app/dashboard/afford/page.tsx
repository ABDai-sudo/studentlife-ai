import { Calculator } from "lucide-react";
import { ModulePage } from "@/components/app/ModulePage";

export default function AffordPage() {
  return (
    <ModulePage
      title="Can I Afford It?"
      subtitle="Check a purchase before you spend"
      icon={Calculator}
      emptyTitle="Check a purchase"
      emptyDescription="Enter item price, money left, and days remaining to see if it fits your safe daily budget."
    />
  );
}
