import { ok } from "@/lib/api";
import { withOwnerApi } from "@/lib/admin/api";
import { prisma } from "@/lib/db";

export async function GET() {
  return withOwnerApi(async () => {
    try {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const [
        failedLogins,
        ownerLogins,
        unauthorizedAdmin,
        suspendedUsers,
        revokedSessions,
        rateLimited,
        recent,
      ] = await Promise.all([
        prisma.securityEvent.count({
          where: { type: "login_failure", createdAt: { gte: since } },
        }),
        prisma.securityEvent.count({
          where: { type: "owner_login_success", createdAt: { gte: since } },
        }),
        prisma.auditLog.count({
          where: {
            action: "admin.unauthorized_access",
            createdAt: { gte: since },
          },
        }),
        prisma.user.count({ where: { status: "SUSPENDED" } }),
        prisma.authSession.count({ where: { revokedAt: { gte: since } } }),
        prisma.securityEvent.count({
          where: { type: "rate_limited", createdAt: { gte: since } },
        }),
        prisma.securityEvent.findMany({
          orderBy: { createdAt: "desc" },
          take: 40,
          select: {
            id: true,
            type: true,
            severity: true,
            messageSafe: true,
            route: true,
            createdAt: true,
          },
        }),
      ]);

      return ok({
        available: true,
        summary: {
          failedLogins,
          ownerLogins,
          unauthorizedAdmin,
          suspendedUsers,
          revokedSessions,
          rateLimited,
          passwordResets: 0,
          emailVerificationFailures: 0,
          validationFailures: 0,
        },
        configuration: {
          mfaEnforcement:
            "Incomplete — models ready, enforcement not active",
          secureCookies: process.env.NODE_ENV === "production",
          rateLimiting:
            "Application-level in-memory (configure Redis for multi-instance)",
          lastSecurityReview: null,
          lastBackupStatus: "Unknown — configure hosting backups",
          dependencyAudit: "Run npm audit in CI",
        },
        recent,
      });
    } catch {
      return ok({
        available: false,
        message: "Security center data unavailable",
        summary: {},
        configuration: {},
        recent: [],
      });
    }
  });
}
