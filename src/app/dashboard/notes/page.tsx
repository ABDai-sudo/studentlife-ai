import { NotebookPen } from "lucide-react";
import { ModulePage } from "@/components/app/ModulePage";

export default function NotesPage() {
  return (
    <ModulePage
      title="My Notes"
      subtitle="Save what you learned in class"
      icon={NotebookPen}
      emptyTitle="No notes yet"
      emptyDescription="Write short notes after class. Example: “Chapter 2 — main points.” Keep it simple."
    />
  );
}
