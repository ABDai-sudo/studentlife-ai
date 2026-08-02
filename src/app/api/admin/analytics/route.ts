import { ok } from "@/lib/api";
import { withOwnerApi } from "@/lib/admin/api";
import { prisma } from "@/lib/db";
import { ALLOWED_ANALYTICS_EVENTS } from "@/services/analytics.service";

export async function GET() {
  return withOwnerApi(async () => {
    try {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const grouped = await prisma.analyticsEvent.groupBy({
        by: ["eventName"],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
        orderBy: { _count: { eventName: "desc" } },
      });
      const byFeature = grouped.map((g) => ({
        feature: g.eventName,
        count: g._count._all,
      }));
      const known = new Set(ALLOWED_ANALYTICS_EVENTS);
      return ok({
        available: true,
        periodDays: 30,
        mostUsed: byFeature.slice(0, 10),
        leastUsed: [...known]
          .map((name) => ({
            feature: name,
            count: byFeature.find((f) => f.feature === name)?.count ?? 0,
          }))
          .sort((a, b) => a.count - b.count)
          .slice(0, 10),
        totals: byFeature,
        note:
          byFeature.length < 20
            ? "Limited data — metrics may be incomplete."
            : null,
      });
    } catch {
      return ok({
        available: false,
        message: "Analytics unavailable",
        mostUsed: [],
        leastUsed: [],
        totals: [],
      });
    }
  });
}
