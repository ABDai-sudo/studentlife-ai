import { Wallet } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatCard } from "@/components/ui/StatCard";
import { formatMoney } from "@/lib/money";
import { getDashboardMoneySummary } from "@/services/expense.service";
import { listBudgetsForUser } from "@/services/budget.service";
import { computeFinancialScoreForUser } from "@/services/score.service";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/validations/expense";

export default async function MoneyDashboardPage() {
  const user = await requireUser();

  let summary: Awaited<ReturnType<typeof getDashboardMoneySummary>> | null =
    null;
  let budgets: Awaited<ReturnType<typeof listBudgetsForUser>> = [];
  let score: Awaited<ReturnType<typeof computeFinancialScoreForUser>> | null =
    null;

  try {
    [summary, budgets, score] = await Promise.all([
      getDashboardMoneySummary(user.id),
      listBudgetsForUser(user.id),
      computeFinancialScoreForUser(user.id, false),
    ]);
  } catch {
    summary = null;
  }

  const currency = summary?.currency ?? "INR";

  return (
    <AppShell
      title="Money Dashboard"
      subtitle="Month survival view"
      userName={user.name ?? "Student"}
    >
      {!summary ? (
        <div className="card-surface border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          Could not load money data. Refresh and try again.
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            <Button href="/dashboard/expenses" size="sm">
              Log expense
            </Button>
            <Button href="/dashboard/budget" variant="secondary" size="sm">
              Set budgets
            </Button>
            <Button href="/dashboard/ai-coach" variant="ai" size="sm">
              Ask coach
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Money left"
              value={
                summary.moneyLeft == null
                  ? "—"
                  : formatMoney(summary.moneyLeft, currency)
              }
              hint={
                summary.pocketMoney == null
                  ? "Set pocket money in Profile"
                  : "Pocket money − month spend"
              }
            />
            <StatCard label="Days left" value={String(summary.daysLeft)} />
            <StatCard
              label="Safe per day"
              value={
                summary.safePerDay == null
                  ? "—"
                  : formatMoney(summary.safePerDay, currency)
              }
            />
            <StatCard
              label="Health score"
              value={score ? String(score.score) : "—"}
              hint={score?.label}
            />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="card-surface p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Category budgets</h3>
                <Badge tone="neutral">
                  {budgets.length > 0 ? "Live" : "Not set"}
                </Badge>
              </div>
              {budgets.length === 0 ? (
                <p className="text-sm text-secondary">
                  No category budgets yet.{" "}
                  <a href="/dashboard/budget" className="text-primary underline">
                    Add limits
                  </a>
                </p>
              ) : (
                <div className="space-y-2.5">
                  {budgets.map((b) => (
                    <ProgressBar
                      key={b.id}
                      value={b.percentUsed}
                      label={`${b.categoryLabel} · ${formatMoney(b.spent, b.currency)} / ${formatMoney(b.amount, b.currency)}`}
                      tone={b.percentUsed >= 85 ? "accent" : "primary"}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="card-surface p-5">
              <h3 className="mb-2 text-sm font-semibold">Money Coach</h3>
              <p className="text-sm text-secondary">
                {score?.insights[0] ||
                  "Ask about safe daily spend, overspending, or a purchase."}
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm text-muted">
                <Wallet className="h-4 w-4" />
                Spent this month: {formatMoney(summary.monthSpent, currency)}
              </div>
              {summary.categories[0] ? (
                <p className="mt-2 text-sm text-secondary">
                  Top category:{" "}
                  {EXPENSE_CATEGORY_LABELS[
                    summary.categories[0]
                      .category as keyof typeof EXPENSE_CATEGORY_LABELS
                  ] ?? summary.categories[0].category}{" "}
                  ({summary.categories[0].percent}%)
                </p>
              ) : null}
              <Button href="/dashboard/ai-coach" variant="ai" size="sm" className="mt-4">
                Open Money Coach
              </Button>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
