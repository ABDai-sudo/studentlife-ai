import { requireOwnerPage } from "@/lib/auth";
import { EmptyState, SimpleBarChart } from "@/components/admin/ui";
import { prisma } from "@/lib/db";
import { daysSeries } from "@/lib/admin/dates";
import { daysAgoDate } from "@/lib/admin/time";

async function loadAnalytics() {
  const since = daysAgoDate(14);
  const events = await prisma.analyticsEvent.findMany({
    where: { createdAt: { gte: since } },
    select: {
      eventName: true,
      createdAt: true,
      userId: true,
      anonymousId: true,
    },
  });
  const series = daysSeries(14);
  const pageViews = series.map((day) => ({
    label: day.label,
    value: events.filter(
      (e) =>
        e.eventName === "page_view" &&
        e.createdAt >= day.start &&
        e.createdAt < day.end
    ).length,
  }));
  const signups = series.map((day) => ({
    label: day.label,
    value: events.filter(
      (e) =>
        e.eventName === "signup_completed" &&
        e.createdAt >= day.start &&
        e.createdAt < day.end
    ).length,
  }));
  const landing = events.filter((e) => e.eventName === "landing_page_view")
    .length;
  const signupCompleted = events.filter(
    (e) => e.eventName === "signup_completed"
  ).length;
  const conversion =
    landing === 0
      ? null
      : Math.round((signupCompleted / landing) * 1000) / 10;

  return {
    eventCount: events.length,
    conversion,
    landing,
    uniqueActors: new Set(events.map((e) => e.userId || e.anonymousId || "x"))
      .size,
    pageViews,
    signups,
  };
}

export default async function AdminAnalyticsPage() {
  await requireOwnerPage();

  let data: Awaited<ReturnType<typeof loadAnalytics>> | null = null;
  try {
    data = await loadAnalytics();
  } catch {
    data = null;
  }

  if (!data) {
    return (
      <EmptyState
        title="Analytics unavailable"
        body="Could not query analytics events. Check database connectivity."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Product Analytics</h1>
        <p className="mt-1 text-sm text-muted">
          Privacy-aware first-party events. No prompt text, notes, or secrets.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card-surface p-4">
          <p className="text-xs uppercase text-muted">Events (14d)</p>
          <p className="mt-2 text-2xl font-semibold">{data.eventCount}</p>
        </div>
        <div className="card-surface p-4">
          <p className="text-xs uppercase text-muted">Landing → signup</p>
          <p className="mt-2 text-2xl font-semibold">
            {data.conversion == null ? "—" : `${data.conversion}%`}
          </p>
          <p className="mt-1 text-xs text-muted">
            {data.landing < 20
              ? "Insufficient volume — estimate incomplete"
              : "Based on event counts"}
          </p>
        </div>
        <div className="card-surface p-4">
          <p className="text-xs uppercase text-muted">Unique actors (14d)</p>
          <p className="mt-2 text-2xl font-semibold">{data.uniqueActors}</p>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <SimpleBarChart title="Page views" data={data.pageViews} />
        <SimpleBarChart title="Signups completed" data={data.signups} />
      </div>
    </div>
  );
}
