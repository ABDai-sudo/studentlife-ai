import { GraduationCap } from "lucide-react";
import { ModulePage } from "@/components/app/ModulePage";

export default function ExamsPage() {
  return (
    <ModulePage
      title="My Exams"
      subtitle="Exam dates in one list"
      icon={GraduationCap}
      emptyTitle="No exams added"
      emptyDescription="Add exam name and date. Example: “Maths midterm — 12 August.”"
    />
  );
}
