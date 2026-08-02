import { prisma } from "@/lib/db";
import { safeLog } from "@/lib/security/safe-log";

export type MetricPoint = { label: string; value: number };

export type OverviewMetrics = {
  available: boolean;
  platformStatus: "Operational" | "Degraded" | "Partial outage" | "Unavailable";
  visitorsToday: number;
  uniqueVisitorsToday: number;
  pageViewsToday: number;
  newRegistrationsToday: number;
  activeUsersToday: number;
  activeUsersWeek: number;
  activeUsersMonth: number;
  activeSessions: number;
  loginSuccessRate: number | null;
  apiErrorRate: number | null;
  avgResponseTimeMs: number | null;
  comparisons: {
    visitorsTodayVsYesterday: number | null;
    activeWeekVsPrev: number | null;
    activeMonthVsPrev: number | null;
  };
  charts: {
    dailyVisitors: MetricPoint[];
    registrations: MetricPoint[];
    dau: MetricPoint[];
    pageViews: MetricPoint[];
    loginOutcomes: MetricPoint[];
    apiErrors: MetricPoint[];
  };
  message?: string;
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysAgo(n: number): Date {
  const d = startOfDay(new Date());
  d.setDate(d.getDate() - n);
  return d;
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export async function getOverviewMetrics(): Promise<OverviewMetrics> {
  try {
    const today = startOfDay(new Date());
    const yesterday = daysAgo(1);
    const weekAgo = daysAgo(7);
    const twoWeeksAgo = daysAgo(14);
    const monthAgo = daysAgo(30);
    const twoMonthsAgo = daysAgo(60);

    const [
      pageViewsToday,
      uniqueRows,
      registrationsToday,
      activeToday,
      activeYesterday,
      activeWeek,
      activePrevWeek,
      activeMonth,
      activePrevMonth,
      activeSessions,
      loginSuccessToday,
      loginFailureToday,
      errorsToday,
      eventsLast14,
      recentUsers,
    ] = await Promise.all([
      prisma.analyticsEvent.count({
        where: { eventName: "page_view", createdAt: { gte: today } },
      }),
      prisma.analyticsEvent.findMany({
        where: {
          eventName: { in: ["page_view", "landing_page_view"] },
          createdAt: { gte: today },
        },
        select: { anonymousId: true, userId: true },
      }),
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.user.count({ where: { lastActiveAt: { gte: today } } }),
      prisma.user.count({
        where: { lastActiveAt: { gte: yesterday, lt: today } },
      }),
      prisma.user.count({ where: { lastActiveAt: { gte: weekAgo } } }),
      prisma.user.count({
        where: { lastActiveAt: { gte: twoWeeksAgo, lt: weekAgo } },
      }),
      prisma.user.count({ where: { lastActiveAt: { gte: monthAgo } } }),
      prisma.user.count({
        where: { lastActiveAt: { gte: twoMonthsAgo, lt: monthAgo } },
      }),
      prisma.authSession.count({
        where: { revokedAt: null, expiresAt: { gt: new Date() } },
      }),
      prisma.analyticsEvent.count({
        where: { eventName: "login_success", createdAt: { gte: today } },
      }),
      prisma.analyticsEvent.count({
        where: { eventName: "login_failure", createdAt: { gte: today } },
      }),
      prisma.appErrorLog.count({ where: { createdAt: { gte: today } } }),
      prisma.analyticsEvent.findMany({
        where: { createdAt: { gte: daysAgo(13) } },
        select: { eventName: true, createdAt: true, userId: true },
      }),
      prisma.user.findMany({
        where: { createdAt: { gte: daysAgo(13) } },
        select: { createdAt: true },
      }),
    ]);

    const uniqueVisitorsToday = new Set(
      uniqueRows.map((r) => r.userId || r.anonymousId || "unknown")
    ).size;
    const loginTotal = loginSuccessToday + loginFailureToday;
    const loginSuccessRate =
      loginTotal === 0
        ? null
        : Math.round((loginSuccessToday / loginTotal) * 1000) / 10;

    const dailyVisitors: MetricPoint[] = [];
    const registrations: MetricPoint[] = [];
    const dau: MetricPoint[] = [];
    const pageViews: MetricPoint[] = [];

    for (let i = 13; i >= 0; i--) {
      const day = daysAgo(i);
      const next = daysAgo(i - 1);
      const label = `${day.getMonth() + 1}/${day.getDate()}`;
      const dayEvents = eventsLast14.filter(
        (e) => e.createdAt >= day && e.createdAt < next
      );
      pageViews.push({
        label,
        value: dayEvents.filter((e) => e.eventName === "page_view").length,
      });
      dailyVisitors.push({
        label,
        value: new Set(
          dayEvents
            .filter((e) =>
              ["page_view", "landing_page_view", "login_success"].includes(
                e.eventName
              )
            )
            .map((e) => e.userId || "anon")
        ).size,
      });
      dau.push({
        label,
        value: new Set(
          dayEvents.filter((e) => e.userId).map((e) => e.userId as string)
        ).size,
      });
      registrations.push({
        label,
        value: recentUsers.filter(
          (u) => u.createdAt >= day && u.createdAt < next
        ).length,
      });
    }

    return {
      available: true,
      platformStatus: errorsToday > 50 ? "Degraded" : "Operational",
      visitorsToday: uniqueVisitorsToday,
      uniqueVisitorsToday,
      pageViewsToday,
      newRegistrationsToday: registrationsToday,
      activeUsersToday: activeToday,
      activeUsersWeek: activeWeek,
      activeUsersMonth: activeMonth,
      activeSessions,
      loginSuccessRate,
      apiErrorRate: null,
      avgResponseTimeMs: null,
      comparisons: {
        visitorsTodayVsYesterday: pctChange(activeToday, activeYesterday),
        activeWeekVsPrev: pctChange(activeWeek, activePrevWeek),
        activeMonthVsPrev: pctChange(activeMonth, activePrevMonth),
      },
      charts: {
        dailyVisitors,
        registrations,
        dau,
        pageViews,
        loginOutcomes: [
          { label: "Success", value: loginSuccessToday },
          { label: "Failure", value: loginFailureToday },
        ],
        apiErrors: [{ label: "Today", value: errorsToday }],
      },
    };
  } catch (error) {
    safeLog("warn", "Overview metrics unavailable", { error: String(error) });
    return {
      available: false,
      platformStatus: "Unavailable",
      visitorsToday: 0,
      uniqueVisitorsToday: 0,
      pageViewsToday: 0,
      newRegistrationsToday: 0,
      activeUsersToday: 0,
      activeUsersWeek: 0,
      activeUsersMonth: 0,
      activeSessions: 0,
      loginSuccessRate: null,
      apiErrorRate: null,
      avgResponseTimeMs: null,
      comparisons: {
        visitorsTodayVsYesterday: null,
        activeWeekVsPrev: null,
        activeMonthVsPrev: null,
      },
      charts: {
        dailyVisitors: [],
        registrations: [],
        dau: [],
        pageViews: [],
        loginOutcomes: [],
        apiErrors: [],
      },
      message: "Metrics unavailable — database may be offline.",
    };
  }
}

export async function checkDatabaseHealth(): Promise<{
  ok: boolean;
  latencyMs: number | null;
  status: "Operational" | "Degraded" | "Unavailable";
}> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - start;
    return {
      ok: true,
      latencyMs,
      status: latencyMs > 1000 ? "Degraded" : "Operational",
    };
  } catch {
    return { ok: false, latencyMs: null, status: "Unavailable" };
  }
}
