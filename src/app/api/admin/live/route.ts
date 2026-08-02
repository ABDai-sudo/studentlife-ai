import { ok } from "@/lib/api";
import { withOwnerApi } from "@/lib/admin/api";
import { prisma } from "@/lib/db";
import { checkDatabaseHealth } from "@/services/admin-metrics.service";
import { safeLog } from "@/lib/security/safe-log";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  return `${local.slice(0, 2)}***@${domain}`;
}

export async function GET() {
  return withOwnerApi(async () => {
    const since = new Date(Date.now() - 15 * 60 * 1000);
    try {
      const [recentSignups, recentLogins, recentFeatures, recentErrors, health] =
        await Promise.all([
          prisma.user.findMany({
            where: { createdAt: { gte: since } },
            select: { id: true, email: true, createdAt: true },
            orderBy: { createdAt: "desc" },
            take: 20,
          }),
          prisma.analyticsEvent.findMany({
            where: { eventName: "login_success", createdAt: { gte: since } },
            select: { userId: true, createdAt: true, browserCategory: true },
            orderBy: { createdAt: "desc" },
            take: 20,
          }),
          prisma.analyticsEvent.findMany({
            where: {
              eventName: {
                in: [
                  "expense_module_opened",
                  "ai_tutor_opened",
                  "dashboard_opened",
                  "assignment_created",
                ],
              },
              createdAt: { gte: since },
            },
            select: { eventName: true, createdAt: true, path: true },
            orderBy: { createdAt: "desc" },
            take: 30,
          }),
          prisma.appErrorLog.findMany({
            where: { createdAt: { gte: since } },
            select: {
              id: true,
              route: true,
              errorCode: true,
              messageSafe: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 15,
          }),
          checkDatabaseHealth(),
        ]);

      const activeApprox = await prisma.authSession.count({
        where: {
          revokedAt: null,
          expiresAt: { gt: new Date() },
          lastSeenAt: { gte: since },
        },
      });

      const loginBursts = await prisma.securityEvent.count({
        where: {
          type: "login_failure",
          createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
        },
      });

      return ok({
        available: true,
        approximateActiveUsers: activeApprox,
        apiHealth: health.status,
        suspiciousLoginBursts: loginBursts >= 10,
        recentSignups: recentSignups.map((u) => ({
          id: u.id,
          email: maskEmail(u.email),
          createdAt: u.createdAt,
        })),
        recentLogins,
        recentFeatures,
        recentErrors,
      });
    } catch (error) {
      safeLog("warn", "Live activity unavailable", { error: String(error) });
      return ok({
        available: false,
        message: "Live activity unavailable",
        approximateActiveUsers: 0,
        apiHealth: "Unavailable",
        suspiciousLoginBursts: false,
        recentSignups: [],
        recentLogins: [],
        recentFeatures: [],
        recentErrors: [],
      });
    }
  });
}
