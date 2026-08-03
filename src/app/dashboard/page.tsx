import { Brain, Wallet } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatCard } from "@/components/ui/StatCard";
import { getDashboardMoneySummary } from "@/services/expense.service";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/validations/expense";
import { formatMoney } from "@/lib/money";

function categoryLabel(category: string) {
  return (
    EXPENSE_CATEGORY_LABELS[
      category as keyof typeof EXPENSE_CATEGORY_LABELS
    ] ?? category
  );
}

export default async function DashboardPage() {
  const user = await requireUser();
  const firstName = user.name?.split(" ")[0] ?? "there";

  let summary: Awaited<ReturnType<typeof getDashboardMoneySummary>> | null =
    null;
  try {
    summary = await getDashboardMoneySummary(user.id);
  } catch {
    summary = null;
  }

  const currency = summary?.currency ?? "INR";
  const hasSpend = (summary?.monthSpent ?? 0) > 0;

  return (
    <AppShell
      title="Overview"
      subtitle="Money first · studies second"
      userName={user.name ?? firstName}
    >
      <div className="mb-5 rounded-2xl border border-primary/20 bg-primary-soft/70 p-5">
        <p className="text-sm font-semibold text-primary">Your money this month</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
          Hello {firstName} — start with safe daily spending
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-secondary">
          Log real expenses below. Numbers on this page update from what you
          save — not fake demo figures.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button href="/dashboard/expenses" size="lg">
            Log an expense
          </Button>
          <Button href="/dashboard/money" variant="secondary" size="lg">
            Money Dashboard
          </Button>
          <Button href="/dashboard/ai-coach" variant="ai" size="lg">
            Ask Money Coach
          </Button>
        </div>
      </div>

      {!summary ? (
        <div className="card-surface border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          Could not load money data. Check your internet connection to the
          database, then refresh.
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              label="Money left"
              value={
                summary.moneyLeft == null
                  ? "—"
                  : formatMoney(summary.moneyLeft, currency)
              }
              hint={
                summary.pocketMoney == null
                  ? "Set pocket money in Profile to unlock this"
                  : "Pocket money minus this month’s spending"
              }
            />
            <StatCard
              label="Days left"
              value={String(summary.daysLeft)}
              hint="This month"
            />
            <StatCard
              label="Safe per day"
              value={
                summary.safePerDay == null
                  ? "—"
                  : formatMoney(summary.safePerDay, currency)
              }
              hint="Money left ÷ days left"
            />
            <StatCard
              label="Monthly spending"
              value={formatMoney(summary.monthSpent, currency)}
              hint={hasSpend ? "From your logged expenses" : "No expenses yet"}
            />
            <StatCard
              label="Spent today"
              value={formatMoney(summary.todaySpent, currency)}
              hint="Logged today"
            />
            <StatCard
              label="Pocket money"
              value={
                summary.pocketMoney == null
                  ? "Not set"
                  : formatMoney(summary.pocketMoney, currency)
              }
              hint="From your profile"
            />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <section className="card-surface p-5 lg:col-span-2">
              <h3 className="mb-4 text-base font-semibold text-foreground">
                Spending by category
              </h3>
              {!hasSpend ? (
                <p className="text-sm text-muted">
                  No spending yet.{" "}
                  <a href="/dashboard/expenses" className="text-primary underline">
                    Log your first expense
                  </a>{" "}
                  to see categories here.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {summary.categories.map((c) => (
                    <ProgressBar
                      key={c.category}
                      value={c.percent}
                      label={`${categoryLabel(c.category)} · ${formatMoney(c.amount, currency)}`}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="card-surface p-5">
              <h3 className="mb-4 text-base font-semibold text-foreground">
                Recent expenses
              </h3>
              {summary.recent.length === 0 ? (
                <p className="text-sm text-muted">Nothing logged yet.</p>
              ) : (
                <ul className="space-y-2.5 text-sm">
                  {summary.recent.map((row) => (
                    <li
                      key={row.id}
                      className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2.5"
                    >
                      <span className="font-medium text-foreground">
                        {row.description || categoryLabel(row.category)}
                      </span>
                      <span className="font-semibold text-foreground">
                        −{formatMoney(row.amount, row.currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <Button
                href="/dashboard/expenses"
                variant="secondary"
                size="sm"
                className="mt-4"
              >
                Open expenses
              </Button>
            </section>
          </div>

          <div className="mt-4 card-surface border-ai/20 bg-ai-soft/40 p-5">
            <div className="mb-3 flex items-center gap-2 text-base font-semibold">
              <Brain className="h-4 w-4 text-ai" />
              Next tip
            </div>
            <p className="text-sm text-secondary">
              {hasSpend
                ? `You’ve spent ${formatMoney(summary.monthSpent, currency)} this month. Keep logging every purchase so your safe daily number stays accurate.`
                : "Start by logging today’s food or travel spend. The overview will update instantly."}
            </p>
            <Button href="/dashboard/expenses" variant="ai" size="sm" className="mt-4">
              <Wallet className="mr-1.5 h-4 w-4" />
              Log spending
            </Button>
          </div>
        </>
      )}
    </AppShell>
  );
}
