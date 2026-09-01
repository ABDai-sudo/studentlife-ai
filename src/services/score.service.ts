import { Prisma, type RiskLevel } from "@prisma/client";
import { prisma } from "@/lib/db";
import { monthBounds } from "@/lib/money";
import { getDashboardMoneySummary } from "@/services/expense.service";
import { listBudgetsForUser } from "@/services/budget.service";
import { listGoalsForUser } from "@/services/goal.service";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/validations/expense";

export type FinancialScoreDto = {
  score: number;
  label: string;
  riskLevel: RiskLevel;
  savingsRate: number;
  budgetAdherence: number;
  spendingDiscipline: number;
  goalProgress: number;
  moneyLeft: number | null;
  daysRemaining: number;
  safeDailySpend: number | null;
  insights: string[];
  periodStart: string;
  periodEnd: string;
};

function labelFor(score: number) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  return "Needs Work";
}

function riskFor(score: number, moneyLeft: number | null, pocket: number | null): RiskLevel {
  if (moneyLeft != null && pocket != null && pocket > 0 && moneyLeft / pocket < 0.15) {
    return "HIGH";
  }
  if (score >= 75) return "LOW";
  if (score >= 55) return "MEDIUM";
  return "HIGH";
}

export async function computeFinancialScoreForUser(
  userId: string,
  persist = true
): Promise<FinancialScoreDto> {
  const { startOfMonth, endOfMonth, daysLeft } = monthBounds();
  const [summary, budgets, goals] = await Promise.all([
    getDashboardMoneySummary(userId),
    listBudgetsForUser(userId),
    listGoalsForUser(userId),
  ]);

  const pocket = summary.pocketMoney;
  const spent = summary.monthSpent;
  const moneyLeft = summary.moneyLeft;

  let budgetAdherence = 70;
  if (budgets.length > 0) {
    const ratios = budgets.map((b) =>
      b.amount > 0 ? Math.min(1.2, b.spent / b.amount) : 0
    );
    const avg = ratios.reduce((a, b) => a + b, 0) / ratios.length;
    budgetAdherence = Math.max(0, Math.round((1.1 - avg) * 100));
  } else if (pocket != null && pocket > 0) {
    budgetAdherence = Math.max(
      0,
      Math.min(100, Math.round((1 - spent / pocket) * 100 + 40))
    );
  }

  const activeGoals = goals.filter((g) => g.status === "ACTIVE" || g.status === "COMPLETED");
  const goalProgress =
    activeGoals.length === 0
      ? 40
      : Math.round(
          activeGoals.reduce((sum, g) => sum + g.progressPercent, 0) /
            activeGoals.length
        );

  const plannedSavings = activeGoals.reduce(
    (sum, g) => sum + (g.monthlyContribution ?? 0),
    0
  );
  const savingsRate =
    pocket != null && pocket > 0
      ? Math.min(100, Math.round((plannedSavings / pocket) * 100 + (moneyLeft != null ? (moneyLeft / pocket) * 20 : 0)))
      : 35;

  let spendingDiscipline = 65;
  if (summary.safePerDay != null && summary.todaySpent > 0) {
    spendingDiscipline =
      summary.todaySpent <= summary.safePerDay
        ? 90
        : Math.max(20, 90 - Math.round((summary.todaySpent / summary.safePerDay - 1) * 40));
  } else if (spent === 0) {
    spendingDiscipline = 55;
  }

  const score = Math.round(
    budgetAdherence * 0.35 +
      spendingDiscipline * 0.25 +
      savingsRate * 0.2 +
      goalProgress * 0.2
  );
  const clamped = Math.max(0, Math.min(100, score));

  const insights: string[] = [];
  if (pocket == null) {
    insights.push("Set pocket money to unlock a more accurate health score.");
  }
  if (budgets.length === 0) {
    insights.push("Add category budgets so adherence can guide your month.");
  }
  if (summary.categories[0]) {
    const top = summary.categories[0];
    const topLabel =
      EXPENSE_CATEGORY_LABELS[top.category as keyof typeof EXPENSE_CATEGORY_LABELS] ??
      top.category;
    insights.push(`Top spend category this month: ${topLabel} (${top.percent}%).`);
  }
  if (summary.safePerDay != null) {
    insights.push(
      `Keep daily spending near ${summary.safePerDay} to protect money left.`
    );
  }

  const dto: FinancialScoreDto = {
    score: clamped,
    label: labelFor(clamped),
    riskLevel: riskFor(clamped, moneyLeft, pocket),
    savingsRate,
    budgetAdherence,
    spendingDiscipline,
    goalProgress,
    moneyLeft,
    daysRemaining: daysLeft,
    safeDailySpend: summary.safePerDay,
    insights,
    periodStart: startOfMonth.toISOString().slice(0, 10),
    periodEnd: endOfMonth.toISOString().slice(0, 10),
  };

  if (persist) {
    await prisma.financialScore.create({
      data: {
        userId,
        score: dto.score,
        label: dto.label,
        savingsRate: dto.savingsRate,
        budgetAdherence: dto.budgetAdherence,
        spendingDiscipline: dto.spendingDiscipline,
        goalProgress: dto.goalProgress,
        riskLevel: dto.riskLevel,
        moneyLeft:
          dto.moneyLeft != null
            ? new Prisma.Decimal(dto.moneyLeft.toFixed(2))
            : null,
        daysRemaining: dto.daysRemaining,
        safeDailySpend:
          dto.safeDailySpend != null
            ? new Prisma.Decimal(dto.safeDailySpend.toFixed(2))
            : null,
        insights: dto.insights,
        periodStart: startOfMonth,
        periodEnd: endOfMonth,
      },
    });
  }

  return dto;
}
