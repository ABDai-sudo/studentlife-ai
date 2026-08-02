import { requireOwnerPage } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const owner = await requireOwnerPage();
  return (
    <AdminShell ownerEmail={owner.email} ownerName={owner.name}>
      {children}
    </AdminShell>
  );
}
