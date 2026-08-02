import { requireOwnerPage } from "@/lib/auth";
import { getOverviewMetrics } from "@/services/admin-metrics.service";
import { recordAuditLog } from "@/services/audit.service";
import { getRequestContext } from "@/lib/security/request";
import {
  EmptyState,
  MetricCard,
  SimpleBarChart,
  StatusPill,
} from "@/components/admin/ui";

export default async function AdminOverviewPage() {
  const owner = await requireOwnerPage();
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

  const m = await getOverviewMetrics();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Overview</h1>
          <p className="mt-1 text-sm text-muted">
            Product and platform metrics from first-party data.
          </p>
        </div>
        <StatusPill status={m.platformStatus} />
      </div>

      {!m.available ? (
        <EmptyState
          title="Metrics unavailable"
          body={
            m.message ||
            "The database could not be reached. The admin UI remains available with empty states."
          }
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Visitors today"
              value={m.visitorsToday}
              delta={m.comparisons.visitorsTodayVsYesterday}
            />
            <MetricCard
              label="Unique visitors today"
              value={m.uniqueVisitorsToday}
            />
            <MetricCard label="Page views today" value={m.pageViewsToday} />
            <MetricCard
              label="New registrations today"
              value={m.newRegistrationsToday}
            />
            <MetricCard label="Active users today" value={m.activeUsersToday} />
            <MetricCard
              label="Active users this week"
              value={m.activeUsersWeek}
              delta={m.comparisons.activeWeekVsPrev}
            />
            <MetricCard
              label="Active users this month"
              value={m.activeUsersMonth}
              delta={m.comparisons.activeMonthVsPrev}
            />
            <MetricCard label="Active sessions" value={m.activeSessions} />
            <MetricCard
              label="Login success rate"
              value={
                m.loginSuccessRate == null ? "—" : `${m.loginSuccessRate}%`
              }
              hint="Today"
            />
            <MetricCard
              label="API error rate"
              value={m.apiErrorRate == null ? "—" : `${m.apiErrorRate}%`}
              hint="Insufficient instrumentation"
            />
            <MetricCard
              label="Avg response time"
              value={
                m.avgResponseTimeMs == null ? "—" : `${m.avgResponseTimeMs} ms`
              }
              hint="Not yet instrumented"
            />
            <MetricCard label="Platform status" value={m.platformStatus} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <SimpleBarChart
              title="Daily visitors (14d)"
              data={m.charts.dailyVisitors}
            />
            <SimpleBarChart
              title="New registrations (14d)"
              data={m.charts.registrations}
            />
            <SimpleBarChart
              title="Daily active users (14d)"
              data={m.charts.dau}
            />
            <SimpleBarChart
              title="Page views (14d)"
              data={m.charts.pageViews}
            />
            <SimpleBarChart
              title="Login outcomes today"
              data={m.charts.loginOutcomes}
            />
            <SimpleBarChart
              title="API / app errors today"
              data={m.charts.apiErrors}
            />
          </div>
        </>
      )}
    </div>
  );
}
