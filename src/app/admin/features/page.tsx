import { requireOwnerPage } from "@/lib/auth";
import { EmptyState } from "@/components/admin/ui";
import { prisma } from "@/lib/db";
import { ALLOWED_ANALYTICS_EVENTS } from "@/services/analytics.service";
import { daysAgoDate } from "@/lib/admin/time";

async function loadFeatures() {
  const since = daysAgoDate(30);
  const grouped = await prisma.analyticsEvent.groupBy({
    by: ["eventName"],
    where: { createdAt: { gte: since } },
    _count: { _all: true },
    orderBy: { _count: { eventName: "desc" } },
  });
  const map = new Map(grouped.map((g) => [g.eventName, g._count._all]));
  return ALLOWED_ANALYTICS_EVENTS.map((name) => ({
    name,
    count: map.get(name) ?? 0,
  })).sort((a, b) => b.count - a.count);
}

export default async function AdminFeaturesPage() {
  await requireOwnerPage();

  let rows: Awaited<ReturnType<typeof loadFeatures>> | null = null;
  try {
    rows = await loadFeatures();
  } catch {
    rows = null;
  }

  if (!rows) {
    return (
      <EmptyState
        title="Feature usage unavailable"
        body="Database could not be queried."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Feature Usage</h1>
        <p className="mt-1 text-sm text-muted">
          Last 30 days · allowlisted events only
        </p>
      </div>
      <div className="overflow-x-auto border-t border-border">
        <table className="min-w-full text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted">
            <tr>
              <th className="px-3 py-3 text-left">Feature event</th>
              <th className="px-3 py-3 text-left">Count</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-b border-border/60">
                <td className="px-3 py-2.5">{r.name}</td>
                <td className="px-3 py-2.5">{r.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
