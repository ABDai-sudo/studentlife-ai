import { BookOpen } from "lucide-react";
import { ModulePage } from "@/components/app/ModulePage";

export default function SubjectsPage() {
  return (
    <ModulePage
      title="My Classes"
      subtitle="Add each class name and time"
      icon={BookOpen}
      emptyTitle="No classes yet"
      emptyDescription="Tap below ideas: write class name like Maths, Science, or English. Then add the day and time."
    />
  );
}
