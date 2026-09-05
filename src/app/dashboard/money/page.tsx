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
import { withDbRetry } from "@/lib/db";
import { MoneyStatLabels } from "@/components/money/MoneyStatLabels";
import { MoneyQuickActions } from "@/components/money/MoneyQuickActions";
import {
  MoneyBudgetStatus,
  MoneyCategoryHeading,
  MoneyLoadError,
  MoneyNoBudgets,
  MoneySpentLabel,
} from "@/components/money/MoneyCategoryHeading";

export default async function MoneyDashboardPage() {
  const user = await requireUser();

  let profile: Awaited<ReturnType<typeof getProfileForUser>> = null;
  let summary: Awaited<ReturnType<typeof getDashboardMoneySummary>> | null =
    null;
  let budgets: Awaited<ReturnType<typeof listBudgetsForUser>> = [];
  let score: Awaited<ReturnType<typeof computeFinancialScoreForUser>> | null =
    null;

  try {
    [profile, summary, budgets] = await Promise.all([
      withDbRetry(() => getProfileForUser(user.id)),
      withDbRetry(() => getDashboardMoneySummary(user.id)),
      withDbRetry(() => listBudgetsForUser(user.id)),
    ]);
    score = await withDbRetry(() =>
      computeFinancialScoreForUser(user.id, false, {
        summary: summary ?? undefined,
        budgets,
      })
    );
  } catch {
    summary = null;
  }

  const assistant = getMoneyAssistantCopy(
    profile?.personalityMode ?? "PROFESSIONAL"
  );

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
            moneyLeftHintKey={
              summary.pocketMoney == null
                ? "money.setPocketHint"
                : "money.pocketMinusSpend"
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
                  <MoneyBudgetStatus live={budgets.length > 0} />
                </Badge>
              </div>
              {budgets.length === 0 ? (
                <MoneyNoBudgets />
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
