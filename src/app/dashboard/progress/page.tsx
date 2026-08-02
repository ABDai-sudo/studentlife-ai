import { Target } from "lucide-react";
import { ModulePage } from "@/components/app/ModulePage";

export default function ProgressPage() {
  return (
    <ModulePage
      title="My Progress"
      subtitle="See how you are doing"
      icon={Target}
      emptyTitle="Progress will show here"
      emptyDescription="After you add classes and homework, this page will show your progress in simple numbers."
    />
  );
}
