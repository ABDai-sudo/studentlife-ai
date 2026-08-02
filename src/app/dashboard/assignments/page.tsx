import { ClipboardList } from "lucide-react";
import { ModulePage } from "@/components/app/ModulePage";

export default function AssignmentsPage() {
  return (
    <ModulePage
      title="My Homework"
      subtitle="See what is due and when"
      icon={ClipboardList}
      emptyTitle="No homework yet"
      emptyDescription="Add work you must finish. Example: “Maths worksheet — due Friday.”"
    />
  );
}
