import type { AuditSeverity, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { safeLog } from "@/lib/security/safe-log";

export type AuditInput = {
  actorUserId?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  success?: boolean;
  severity?: AuditSeverity;
  reason?: string | null;
  requestId?: string | null;
  ipHash?: string | null;
  userAgentCat?: string | null;
  metadata?: Prisma.InputJsonValue;
};

export async function recordAuditLog(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: input.actorUserId ?? null,
        action: input.action,
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
        success: input.success ?? true,
        severity: input.severity ?? "INFO",
        reason: input.reason ?? null,
        requestId: input.requestId ?? null,
        ipHash: input.ipHash ?? null,
        userAgentCat: input.userAgentCat ?? null,
        metadata: input.metadata,
      },
    });
  } catch (error) {
    safeLog("warn", "Audit log write failed", {
      action: input.action,
      error: String(error),
    });
  }
}

export async function recordSecurityEvent(input: {
  type: string;
  severity?: AuditSeverity;
  userId?: string | null;
  ipHash?: string | null;
  route?: string | null;
  messageSafe: string;
  metadata?: Prisma.InputJsonValue;
}): Promise<void> {
  try {
    await prisma.securityEvent.create({
      data: {
        type: input.type,
        severity: input.severity ?? "LOW",
        userId: input.userId ?? null,
        ipHash: input.ipHash ?? null,
        route: input.route ?? null,
        messageSafe: input.messageSafe.slice(0, 500),
        metadata: input.metadata,
      },
    });
  } catch (error) {
    safeLog("warn", "Security event write failed", {
      type: input.type,
      error: String(error),
    });
  }
}
