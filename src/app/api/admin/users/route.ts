import { z } from "zod";
import { ok, fail } from "@/lib/api";
import { withOwnerApi } from "@/lib/admin/api";
import { prisma } from "@/lib/db";
import { recordAuditLog } from "@/services/audit.service";
import { getRequestContext } from "@/lib/security/request";
import { toCsv } from "@/lib/security/csv";
import { rateLimit } from "@/lib/security/rate-limit";
import { revokeAllSessionsForUser } from "@/services/auth.service";
import { verifyPassword } from "@/lib/auth/password";

const listSchema = z.object({
  q: z.string().max(200).optional(),
  role: z.enum(["USER", "OWNER", "ALL"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "DISABLED", "ALL"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  export: z.enum(["csv"]).optional(),
});

const userSafeSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  emailVerified: true,
  createdAt: true,
  lastActiveAt: true,
  lastLoginAt: true,
  failedLoginCount: true,
  mfaEnabled: true,
} as const;

export async function GET(request: Request) {
  return withOwnerApi(async (owner) => {
    const url = new URL(request.url);
    const parsed = listSchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) {
      return fail("Invalid query", { code: "VALIDATION_ERROR", status: 422 });
    }

    const { q, role, status, page, pageSize, export: exportFmt } = parsed.data;
    const where = {
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: "insensitive" as const } },
              { name: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(role && role !== "ALL" ? { role } : {}),
      ...(status && status !== "ALL" ? { status } : {}),
    };

    if (exportFmt === "csv") {
      const rl = rateLimit(`admin-export:${owner.id}`, {
        limit: 5,
        windowSec: 3600,
      });
      if (!rl.allowed) {
        return fail("Export rate limited", { code: "RATE_LIMITED", status: 429 });
      }

      const rows = await prisma.user.findMany({
        where,
        select: userSafeSelect,
        take: 5000,
        orderBy: { createdAt: "desc" },
      });

      const ctx = await getRequestContext();
      await recordAuditLog({
        actorUserId: owner.id,
        action: "admin.users_export",
        targetType: "user",
        success: true,
        requestId: ctx.requestId,
        ipHash: ctx.ipHash,
        metadata: { count: rows.length },
      });

      const csv = toCsv(
        [
          "id",
          "email",
          "name",
          "role",
          "status",
          "emailVerified",
          "createdAt",
          "lastActiveAt",
          "lastLoginAt",
          "failedLoginCount",
        ],
        rows.map((u) => [
          u.id,
          u.email,
          u.name,
          u.role,
          u.status,
          u.emailVerified,
          u.createdAt.toISOString(),
          u.lastActiveAt?.toISOString() ?? "",
          u.lastLoginAt?.toISOString() ?? "",
          u.failedLoginCount,
        ])
      );

      return new Response(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="users-export.csv"',
          "Cache-Control": "no-store",
        },
      });
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          ...userSafeSelect,
          authSessions: {
            where: { revokedAt: null, expiresAt: { gt: new Date() } },
            select: { id: true },
          },
          _count: { select: { expenses: true, assignments: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return ok({
      page,
      pageSize,
      total,
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        status: u.status,
        emailVerified: u.emailVerified,
        createdAt: u.createdAt,
        lastActiveAt: u.lastActiveAt,
        lastLoginAt: u.lastLoginAt,
        failedLoginCount: u.failedLoginCount,
        activeSessions: u.authSessions.length,
        featureSummary: {
          expenses: u._count.expenses,
          assignments: u._count.assignments,
        },
      })),
    });
  });
}

const actionSchema = z.object({
  userId: z.string().min(1),
  action: z.enum([
    "suspend",
    "reactivate",
    "revoke_sessions",
    "reset_failed_logins",
  ]),
  password: z.string().min(1),
  confirm: z.string().optional(),
});

export async function POST(request: Request) {
  return withOwnerApi(async (owner) => {
    const body = await request.json().catch(() => null);
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Validation failed", { code: "VALIDATION_ERROR", status: 422 });
    }

    const ownerRecord = await prisma.user.findUnique({
      where: { id: owner.id },
      select: { passwordHash: true },
    });
    if (!ownerRecord) return fail("Reauthentication failed", { status: 401 });

    const okPw = await verifyPassword(
      parsed.data.password,
      ownerRecord.passwordHash
    );
    if (!okPw) {
      return fail("Reauthentication failed", {
        code: "REAUTH_REQUIRED",
        status: 401,
      });
    }

    const target = await prisma.user.findUnique({
      where: { id: parsed.data.userId },
      select: { id: true, role: true, status: true },
    });
    if (!target) return fail("User not found", { status: 404 });
    if (target.role === "OWNER" && parsed.data.action === "suspend") {
      return fail("Cannot suspend an owner via this workflow", { status: 400 });
    }

    const ctx = await getRequestContext();

    if (parsed.data.action === "suspend") {
      if (parsed.data.confirm !== "SUSPEND") {
        return fail("Type SUSPEND to confirm", { status: 400 });
      }
      await prisma.user.update({
        where: { id: target.id },
        data: { status: "SUSPENDED", suspendedAt: new Date() },
      });
      await revokeAllSessionsForUser(target.id);
      await recordAuditLog({
        actorUserId: owner.id,
        action: "admin.user_suspend",
        targetType: "user",
        targetId: target.id,
        requestId: ctx.requestId,
        ipHash: ctx.ipHash,
        severity: "HIGH",
      });
    } else if (parsed.data.action === "reactivate") {
      await prisma.user.update({
        where: { id: target.id },
        data: { status: "ACTIVE", suspendedAt: null },
      });
      await recordAuditLog({
        actorUserId: owner.id,
        action: "admin.user_reactivate",
        targetType: "user",
        targetId: target.id,
        requestId: ctx.requestId,
        ipHash: ctx.ipHash,
      });
    } else if (parsed.data.action === "revoke_sessions") {
      const count = await revokeAllSessionsForUser(target.id);
      await recordAuditLog({
        actorUserId: owner.id,
        action: "admin.session_revoke_all",
        targetType: "user",
        targetId: target.id,
        requestId: ctx.requestId,
        ipHash: ctx.ipHash,
        metadata: { count },
        severity: "MEDIUM",
      });
    } else if (parsed.data.action === "reset_failed_logins") {
      await prisma.user.update({
        where: { id: target.id },
        data: { failedLoginCount: 0 },
      });
      await recordAuditLog({
        actorUserId: owner.id,
        action: "admin.reset_failed_logins",
        targetType: "user",
        targetId: target.id,
        requestId: ctx.requestId,
        ipHash: ctx.ipHash,
      });
    }

    return ok({ success: true });
  });
}
