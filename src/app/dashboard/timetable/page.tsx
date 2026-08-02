import { CalendarDays } from "lucide-react";
import { ModulePage } from "@/components/app/ModulePage";

export default function TimetablePage() {
  return (
    <ModulePage
      title="My Schedule"
      subtitle="Your class times for the week"
      icon={CalendarDays}
      emptyTitle="No schedule yet"
      emptyDescription="Add when each class happens. Example: “Science — Tuesday 2 PM.”"
    />
  );
}
