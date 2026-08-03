import { ChartColumn } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatCard } from "@/components/ui/StatCard";
import { formatMoney } from "@/lib/money";
import { getMonthlyReportForUser } from "@/services/report.service";

export default async function ReportsPage() {
  const user = await requireUser();

  let report: Awaited<ReturnType<typeof getMonthlyReportForUser>> | null = null;
  try {
    report = await getMonthlyReportForUser(user.id);
  } catch {
    report = null;
  }

  return (
    <AppShell
      title="Reports"
      subtitle="Weekly & monthly money review"
      userName={user.name ?? "Student"}
    >
      {!report ? (
        <div className="card-surface border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          Could not load report.
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-2 text-sm text-secondary">
            <ChartColumn className="h-4 w-4 text-primary" />
            {report.periodStart} → {report.periodEnd}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Month spent"
              value={formatMoney(report.monthSpent, report.currency)}
            />
            <StatCard
              label="Last 7 days"
              value={formatMoney(report.weekSpent, report.currency)}
              hint={`${report.weekTxnCount} expenses`}
            />
            <StatCard
              label="Money left"
              value={
                report.moneyLeft == null
                  ? "—"
                  : formatMoney(report.moneyLeft, report.currency)
              }
            />
            <StatCard
              label="Health score"
              value={String(report.score.score)}
              hint={report.score.label}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="card-surface p-5">
              <h3 className="mb-4 text-sm font-semibold">Category mix</h3>
              {report.categories.length === 0 ? (
                <p className="text-sm text-muted">No expenses this month.</p>
              ) : (
                <div className="space-y-2.5">
                  {report.categories.map((c) => (
                    <ProgressBar
                      key={c.category}
                      value={c.percent}
                      label={`${c.label} · ${formatMoney(c.amount, report.currency)}`}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="card-surface p-5">
              <h3 className="mb-4 text-sm font-semibold">Coach insights</h3>
              <ul className="space-y-2 text-sm text-secondary">
                {report.score.insights.map((tip) => (
                  <li key={tip}>• {tip}</li>
                ))}
              </ul>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted">Budget adherence</p>
                  <p className="font-semibold">{report.score.budgetAdherence}</p>
                </div>
                <div>
                  <p className="text-muted">Spending discipline</p>
                  <p className="font-semibold">{report.score.spendingDiscipline}</p>
                </div>
                <div>
                  <p className="text-muted">Savings rate</p>
                  <p className="font-semibold">{report.score.savingsRate}</p>
                </div>
                <div>
                  <p className="text-muted">Goal progress</p>
                  <p className="font-semibold">{report.score.goalProgress}</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}
    </AppShell>
  );
}
