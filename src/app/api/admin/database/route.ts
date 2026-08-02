import { ok } from "@/lib/api";
import { withOwnerApi } from "@/lib/admin/api";
import { checkDatabaseHealth } from "@/services/admin-metrics.service";
import { prisma } from "@/lib/db";

export async function GET() {
  return withOwnerApi(async () => {
    const health = await checkDatabaseHealth();
    let tableCounts: Record<string, number | string> = {};
    try {
      const [users, events, sessions, audits, errors] = await Promise.all([
        prisma.user.count(),
        prisma.analyticsEvent.count(),
        prisma.authSession.count(),
        prisma.auditLog.count(),
        prisma.appErrorLog.count(),
      ]);
      tableCounts = {
        users,
        analytics_events: events,
        auth_sessions: sessions,
        audit_logs: audits,
        app_error_logs: errors,
      };
    } catch {
      tableCounts = { error: "counts_unavailable" };
    }
    return ok({
      connected: health.ok,
      latencyMs: health.latencyMs,
      status: health.status,
      provider: "postgresql",
      tableCounts,
    });
  });
}
