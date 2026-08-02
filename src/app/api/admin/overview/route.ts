import { ok } from "@/lib/api";
import { withOwnerApi } from "@/lib/admin/api";
import { getOverviewMetrics } from "@/services/admin-metrics.service";
import { recordAuditLog } from "@/services/audit.service";
import { getRequestContext } from "@/lib/security/request";

export async function GET() {
  return withOwnerApi(async (owner) => {
    const ctx = await getRequestContext();
    void recordAuditLog({
      actorUserId: owner.id,
      action: "admin.dashboard_access",
      targetType: "admin",
      targetId: "overview",
      requestId: ctx.requestId,
      ipHash: ctx.ipHash,
      userAgentCat: ctx.userAgentCat,
    });
    return ok(await getOverviewMetrics());
  });
}
