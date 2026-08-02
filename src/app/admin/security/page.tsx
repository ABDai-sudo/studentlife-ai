import { requireOwnerPage } from "@/lib/auth";
import { EmptyState } from "@/components/admin/ui";
import { prisma } from "@/lib/db";
import { daysAgoDate } from "@/lib/admin/time";

async function loadSecurity() {
  const since = daysAgoDate(7);
  const [failedLogins, ownerLogins, unauthorized, suspended, recent] =
    await Promise.all([
      prisma.securityEvent.count({
        where: { type: "login_failure", createdAt: { gte: since } },
      }),
      prisma.securityEvent.count({
        where: { type: "owner_login_success", createdAt: { gte: since } },
      }),
      prisma.auditLog.count({
        where: {
          action: "admin.unauthorized_access",
          createdAt: { gte: since },
        },
      }),
      prisma.user.count({ where: { status: "SUSPENDED" } }),
      prisma.securityEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 30,
        select: {
          id: true,
          type: true,
          severity: true,
          messageSafe: true,
          createdAt: true,
        },
      }),
    ]);
  return { failedLogins, ownerLogins, unauthorized, suspended, recent };
}

export default async function AdminSecurityPage() {
  await requireOwnerPage();

  let data: Awaited<ReturnType<typeof loadSecurity>> | null = null;
  try {
    data = await loadSecurity();
  } catch {
    data = null;
  }

  if (!data) {
    return (
      <EmptyState
        title="Security center unavailable"
        body="Could not load security events."
      />
    );
  }

  const { failedLogins, ownerLogins, unauthorized, suspended, recent } = data;
  const secureCookies = process.env.NODE_ENV === "production";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Security Center</h1>
        <p className="mt-1 text-sm text-muted">
          Operational security signals — not a threat theater.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Failed logins (7d)" value={failedLogins} />
        <Stat label="Owner logins (7d)" value={ownerLogins} />
        <Stat label="Unauthorized admin attempts" value={unauthorized} />
        <Stat label="Suspended users" value={suspended} />
      </div>
      <div className="card-surface p-4">
        <h2 className="text-sm font-semibold">Configuration status</h2>
        <ul className="mt-3 space-y-2 text-sm text-secondary">
          <li>OWNER MFA enforcement: incomplete (models ready)</li>
          <li>
            Secure cookies:{" "}
            {secureCookies
              ? "enabled in production"
              : "Secure flag off in development"}
          </li>
          <li>
            Rate limiting: in-memory application layer (document Redis for
            multi-instance)
          </li>
          <li>Dependency audit: run `npm audit` in CI</li>
          <li>Last backup status: configure on hosting provider</li>
        </ul>
      </div>
      <div className="card-surface overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted">
            <tr>
              <th className="px-3 py-3 text-left">When</th>
              <th className="px-3 py-3 text-left">Severity</th>
              <th className="px-3 py-3 text-left">Type</th>
              <th className="px-3 py-3 text-left">Message</th>
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-muted">
                  No security events yet.
                </td>
              </tr>
            ) : (
              recent.map((e) => (
                <tr key={e.id} className="border-b border-border/60">
                  <td className="whitespace-nowrap px-3 py-2">
                    {e.createdAt.toLocaleString()}
                  </td>
                  <td className="px-3 py-2">{e.severity}</td>
                  <td className="px-3 py-2">{e.type}</td>
                  <td className="px-3 py-2">{e.messageSafe}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card-surface p-4">
      <p className="text-xs uppercase text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
