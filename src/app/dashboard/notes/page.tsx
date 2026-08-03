import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { NotesClient } from "@/components/academics/NotesClient";

export default async function NotesPage() {
  const user = await requireUser();
  return (
    <AppShell title="Notes" subtitle="Study notes by class" userName={user.name ?? "Student"}>
      <NotesClient />
    </AppShell>
  );
}
