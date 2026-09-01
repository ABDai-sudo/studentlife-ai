import { requireOwnerPage } from "@/lib/auth";
import { StatusPill } from "@/components/admin/ui";
import { checkDatabaseHealth } from "@/services/admin-metrics.service";
import { prisma } from "@/lib/db";

export default async function AdminDatabasePage() {
  await requireOwnerPage();
  const health = await checkDatabaseHealth();
  let counts: Record<string, number> = {};
  try {
    const [users, events, sessions, audits, errors] = await Promise.all([
      prisma.user.count(),
      prisma.analyticsEvent.count(),
      prisma.authSession.count(),
      prisma.auditLog.count(),
      prisma.appErrorLog.count(),
    ]);
    counts = {
      users,
      analytics_events: events,
      auth_sessions: sessions,
      audit_logs: audits,
      app_error_logs: errors,
    };
  } catch {
    counts = {};
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Database Status</h1>
          <p className="mt-1 text-sm text-muted">
            Connectivity and row counts · host/name never shown
          </p>
        </div>
        <StatusPill status={health.status} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="border-t border-border pt-4">
          <p className="text-xs uppercase text-muted">Connected</p>
          <p className="mt-2 font-semibold">{health.ok ? "Yes" : "No"}</p>
        </div>
        <div className="border-t border-border pt-4">
          <p className="text-xs uppercase text-muted">Query latency</p>
          <p className="mt-2 font-semibold">
            {health.latencyMs == null ? "—" : `${health.latencyMs} ms`}
          </p>
        </div>
      </div>
      <div className="border-t border-border pt-4">
        <h2 className="text-sm font-semibold">Table counts</h2>
        {Object.keys(counts).length === 0 ? (
          <p className="mt-3 text-sm text-muted">Counts unavailable</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {Object.entries(counts).map(([k, v]) => (
              <li key={k} className="flex justify-between">
                <span>{k}</span>
                <span className="text-muted">{v}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
