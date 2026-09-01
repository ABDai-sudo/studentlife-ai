import { requireOwnerPage } from "@/lib/auth";
import { EmptyState } from "@/components/admin/ui";
import { prisma } from "@/lib/db";
import { daysAgoDate } from "@/lib/admin/time";

async function loadErrors() {
  const since = daysAgoDate(7);
  const [countWeek, errors, routes] = await Promise.all([
    prisma.appErrorLog.count({ where: { createdAt: { gte: since } } }),
    prisma.appErrorLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        route: true,
        method: true,
        statusCode: true,
        errorCode: true,
        messageSafe: true,
        resolved: true,
        createdAt: true,
      },
    }),
    prisma.appErrorLog.groupBy({
      by: ["route"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { route: "desc" } },
      take: 8,
    }),
  ]);
  return { countWeek, errors, routes };
}

export default async function AdminErrorsPage() {
  await requireOwnerPage();

  let data: Awaited<ReturnType<typeof loadErrors>> | null = null;
  try {
    data = await loadErrors();
  } catch {
    data = null;
  }

  if (!data) {
    return (
      <EmptyState title="Errors unavailable" body="Could not load error logs." />
    );
  }

  const { countWeek, errors, routes } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Errors</h1>
        <p className="mt-1 text-sm text-muted">
          Safe metadata only · {countWeek} events in 7 days
        </p>
      </div>
      <div className="border-t border-border pt-4">
        <h2 className="text-sm font-semibold">Most failing routes</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {routes.length === 0 ? (
            <li className="text-muted">No errors recorded yet.</li>
          ) : (
            routes.map((r) => (
              <li
                key={r.route || "unknown"}
                className="flex justify-between gap-3"
              >
                <span>{r.route || "(unknown)"}</span>
                <span className="text-muted">{r._count._all}</span>
              </li>
            ))
          )}
        </ul>
      </div>
      <div className="overflow-x-auto border-t border-border">
        <table className="min-w-full text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted">
            <tr>
              <th className="px-3 py-3 text-left">When</th>
              <th className="px-3 py-3 text-left">Route</th>
              <th className="px-3 py-3 text-left">Code</th>
              <th className="px-3 py-3 text-left">Message</th>
              <th className="px-3 py-3 text-left">Resolved</th>
            </tr>
          </thead>
          <tbody>
            {errors.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-muted">
                  No errors logged yet.
                </td>
              </tr>
            ) : (
              errors.map((e) => (
                <tr key={e.id} className="border-b border-border/60">
                  <td className="whitespace-nowrap px-3 py-2">
                    {e.createdAt.toLocaleString()}
                  </td>
                  <td className="px-3 py-2">{e.route || "—"}</td>
                  <td className="px-3 py-2">{e.errorCode}</td>
                  <td className="px-3 py-2">{e.messageSafe}</td>
                  <td className="px-3 py-2">{e.resolved ? "Yes" : "No"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
