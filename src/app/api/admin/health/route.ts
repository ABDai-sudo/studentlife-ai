import { ok } from "@/lib/api";
import { withOwnerApi } from "@/lib/admin/api";
import { checkDatabaseHealth } from "@/services/admin-metrics.service";
import { prisma } from "@/lib/db";

export async function GET() {
  return withOwnerApi(async () => {
    const db = await checkDatabaseHealth();
    const started = Number(process.env.SERVER_STARTED_AT || Date.now());
    const uptimeSec = Math.floor((Date.now() - started) / 1000);

    let analyticsOk = false;
    let errorRate: number | null = null;
    try {
      const since = new Date(Date.now() - 60 * 60 * 1000);
      const [events, errors] = await Promise.all([
        prisma.analyticsEvent.count({ where: { createdAt: { gte: since } } }),
        prisma.appErrorLog.count({ where: { createdAt: { gte: since } } }),
      ]);
      analyticsOk = true;
      const denom = events + errors;
      errorRate = denom === 0 ? 0 : Math.round((errors / denom) * 1000) / 10;
    } catch {
      analyticsOk = false;
    }

    const overall = !db.ok
      ? "Unavailable"
      : db.status === "Degraded" || (errorRate != null && errorRate > 10)
        ? "Degraded"
        : "Operational";

    return ok({
      status: overall,
      application: "Operational",
      database: {
        connected: db.ok,
        latencyMs: db.latencyMs,
        status: db.status,
      },
      authentication: db.ok ? "Operational" : "Degraded",
      api: {
        availability: db.ok ? "Operational" : "Unavailable",
        errorRate,
      },
      analyticsIngestion: analyticsOk ? "Operational" : "Unavailable",
      buildId:
        process.env.VERCEL_GIT_COMMIT_SHA || process.env.BUILD_ID || "local",
      environment: process.env.NODE_ENV || "development",
      uptimeSec,
      lastDeployment:
        process.env.VERCEL_DEPLOYMENT_ID || process.env.LAST_DEPLOYMENT || null,
      backgroundJobs: "Not configured",
    });
  });
}
