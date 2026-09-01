import { Wallet } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatMoney } from "@/lib/money";
import { getDashboardMoneySummary } from "@/services/expense.service";
import { listBudgetsForUser } from "@/services/budget.service";
import { computeFinancialScoreForUser } from "@/services/score.service";
import { getProfileForUser } from "@/services/profile.service";
import { getMoneyAssistantCopy } from "@/lib/personality";
import { MoneyStatLabels } from "@/components/money/MoneyStatLabels";
import { MoneyQuickActions } from "@/components/money/MoneyQuickActions";
import { MoneyCategoryHeading, MoneyLoadError, MoneySpentLabel } from "@/components/money/MoneyCategoryHeading";

export default async function MoneyDashboardPage() {
  const user = await requireUser();
  const profile = await getProfileForUser(user.id);
  const assistant = getMoneyAssistantCopy(
    profile?.personalityMode ?? "PROFESSIONAL"
  );

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
      subtitle="This month at a glance"
      titleKey="money.title"
      subtitleKey="money.subtitle"
      userName={user.name ?? "Student"}
    >
      {!summary ? (
        <MoneyLoadError />
      ) : (
        <>
          <MoneyQuickActions coachCta={assistant.askCta} />

          <MoneyStatLabels
            moneyLeft={
              summary.moneyLeft == null
                ? "—"
                : formatMoney(summary.moneyLeft, currency)
            }
            moneyLeftHint={
              summary.pocketMoney == null
                ? "Set pocket money in Profile"
                : "Pocket money − month spend"
            }
            daysLeft={String(summary.daysLeft)}
            safeDaily={
              summary.safePerDay == null
                ? "—"
                : formatMoney(summary.safePerDay, currency)
            }
            healthScore={score ? String(score.score) : "—"}
            healthHint={score?.label}
          />

          <div className="mt-8 grid gap-8 border-t border-border pt-6 lg:grid-cols-2">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <MoneyCategoryHeading />
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

            <div className="border-t border-border pt-6 lg:border-t-0 lg:border-s lg:ps-8 lg:pt-0">
              <h3 className="mb-2 text-sm font-semibold">{assistant.name}</h3>
              <p className="text-sm leading-relaxed text-secondary">
                {score?.insights[0] || assistant.subtitle}
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm text-muted">
                <Wallet className="h-4 w-4 shrink-0" />
                <MoneySpentLabel
                  amount={formatMoney(summary.monthSpent, currency)}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
