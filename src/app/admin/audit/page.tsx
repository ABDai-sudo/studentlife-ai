import { requireOwnerPage } from "@/lib/auth";
import { EmptyState } from "@/components/admin/ui";
import { prisma } from "@/lib/db";

async function loadAudit() {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      action: true,
      actorUserId: true,
      targetType: true,
      targetId: true,
      success: true,
      severity: true,
      reason: true,
      createdAt: true,
    },
  });
}

export default async function AdminAuditPage() {
  await requireOwnerPage();

  let logs: Awaited<ReturnType<typeof loadAudit>> | null = null;
  try {
    logs = await loadAudit();
  } catch {
    logs = null;
  }

  if (!logs) {
    return (
      <EmptyState
        title="Audit logs unavailable"
        body="Could not load audit logs."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Audit Logs</h1>
        <p className="mt-1 text-sm text-muted">
          Append-only style records · not editable from this dashboard
        </p>
      </div>
      <div className="overflow-x-auto border-t border-border">
        <table className="min-w-full text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted">
            <tr>
              <th className="px-3 py-3 text-left">When</th>
              <th className="px-3 py-3 text-left">Action</th>
              <th className="px-3 py-3 text-left">Actor</th>
              <th className="px-3 py-3 text-left">Target</th>
              <th className="px-3 py-3 text-left">Result</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-muted">
                  No audit events yet.
                </td>
              </tr>
            ) : (
              logs.map((l) => (
                <tr key={l.id} className="border-b border-border/60">
                  <td className="whitespace-nowrap px-3 py-2">
                    {l.createdAt.toLocaleString()}
                  </td>
                  <td className="px-3 py-2">{l.action}</td>
                  <td className="px-3 py-2">
                    {l.actorUserId ? `${l.actorUserId.slice(0, 8)}…` : "—"}
                  </td>
                  <td className="px-3 py-2">
                    {[l.targetType, l.targetId].filter(Boolean).join(" / ") ||
                      "—"}
                  </td>
                  <td className="px-3 py-2">
                    {l.success ? "success" : "failure"}
                    {l.reason ? ` · ${l.reason}` : ""}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
