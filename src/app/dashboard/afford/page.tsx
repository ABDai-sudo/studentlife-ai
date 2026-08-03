import { Calculator } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { AffordClient } from "@/components/afford/AffordClient";

export default async function AffordPage() {
  const user = await requireUser();
  return (
    <AppShell
      title="Can I Afford It?"
      subtitle="Check a purchase against money left"
      userName={user.name ?? "Student"}
    >
      <div className="mb-4 flex items-center gap-2 text-sm text-secondary">
        <Calculator className="h-4 w-4 text-primary" />
        Guidance from your numbers — not a guarantee or loan offer.
      </div>
      <AffordClient />
    </AppShell>
  );
}
