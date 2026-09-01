import { requireOwnerPage } from "@/lib/auth";
import { StatusPill, EmptyState } from "@/components/admin/ui";
import { checkDatabaseHealth } from "@/services/admin-metrics.service";
import { prisma } from "@/lib/db";
import { msAgo } from "@/lib/admin/time";

export default async function AdminHealthPage() {
  await requireOwnerPage();
  const db = await checkDatabaseHealth();
  let errorCount: number | null = null;
  try {
    const since = msAgo(60 * 60 * 1000);
    errorCount = await prisma.appErrorLog.count({
      where: { createdAt: { gte: since } },
    });
  } catch {
    errorCount = null;
  }

  const status = !db.ok
    ? "Unavailable"
    : db.status === "Degraded"
      ? "Degraded"
      : "Operational";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">System Health</h1>
          <p className="mt-1 text-sm text-muted">
            Owner-only diagnostics · no secrets or hostnames exposed
          </p>
        </div>
        <StatusPill status={status} />
      </div>
      {!db.ok ? (
        <EmptyState
          title="Database connectivity issue"
          body="Application UI can still render. Auth and metrics that need Postgres will fail until connectivity is restored."
        />
      ) : null}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Info label="Application" value="Operational" />
        <Info
          label="Database"
          value={db.ok ? `Connected · ${db.latencyMs} ms` : "Unavailable"}
        />
        <Info
          label="Authentication service"
          value={db.ok ? "Operational" : "Degraded"}
        />
        <Info
          label="API availability"
          value={db.ok ? "Operational" : "Unavailable"}
        />
        <Info
          label="Errors (last hour)"
          value={errorCount == null ? "—" : String(errorCount)}
        />
        <Info
          label="Build / version"
          value={
            process.env.VERCEL_GIT_COMMIT_SHA ||
            process.env.BUILD_ID ||
            "local-dev"
          }
        />
        <Info
          label="Last deployment id"
          value={process.env.VERCEL_DEPLOYMENT_ID || "—"}
        />
        <Info
          label="Analytics ingestion"
          value={db.ok ? "Operational" : "Unavailable"}
        />
        <Info label="Background jobs" value="Not configured" />
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-border pt-4">
      <p className="text-xs uppercase text-muted">{label}</p>
      <p className="mt-2 break-all text-sm font-medium">{value}</p>
    </div>
  );
}
