import { z } from "zod";
import { ok, fail } from "@/lib/api";
import { withOwnerApi } from "@/lib/admin/api";
import { prisma } from "@/lib/db";
import { recordAuditLog } from "@/services/audit.service";
import { getRequestContext } from "@/lib/security/request";

const settingsSchema = z
  .object({
    analyticsRetentionDays: z.number().int().min(7).max(730).optional(),
    auditRetentionDays: z.number().int().min(30).max(2555).optional(),
    errorRetentionDays: z.number().int().min(7).max(365).optional(),
    analyticsOptOutDefault: z.boolean().optional(),
  })
  .strict();

export async function GET() {
  return withOwnerApi(async () => {
    try {
      const rows = await prisma.platformSetting.findMany();
      const map: Record<string, unknown> = {};
      for (const r of rows) map[r.key] = r.value;
      return ok({
        available: true,
        settings: {
          analyticsRetentionDays: Number(map.analyticsRetentionDays ?? 90),
          auditRetentionDays: Number(map.auditRetentionDays ?? 365),
          errorRetentionDays: Number(map.errorRetentionDays ?? 90),
          analyticsOptOutDefault: Boolean(map.analyticsOptOutDefault ?? false),
          mfaStatus:
            "Planned — OWNER MFA models exist; enforcement incomplete until TOTP/WebAuthn is enabled and tested.",
        },
      });
    } catch {
      return ok({
        available: false,
        settings: {
          analyticsRetentionDays: 90,
          auditRetentionDays: 365,
          errorRetentionDays: 90,
          analyticsOptOutDefault: false,
          mfaStatus: "Unavailable",
        },
      });
    }
  });
}

export async function PUT(request: Request) {
  return withOwnerApi(async (owner) => {
    const body = await request.json().catch(() => null);
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Validation failed", { code: "VALIDATION_ERROR", status: 422 });
    }
    const ctx = await getRequestContext();
    for (const [key, value] of Object.entries(parsed.data)) {
      await prisma.platformSetting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      });
    }
    await recordAuditLog({
      actorUserId: owner.id,
      action: "admin.settings_change",
      targetType: "settings",
      requestId: ctx.requestId,
      ipHash: ctx.ipHash,
      metadata: parsed.data,
      severity: "MEDIUM",
    });
    return ok({ success: true });
  });
}
