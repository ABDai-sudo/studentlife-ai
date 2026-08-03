import { prisma } from "@/lib/db";
import { monthBounds } from "@/lib/money";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/validations/expense";
import { getDashboardMoneySummary } from "@/services/expense.service";
import { computeFinancialScoreForUser } from "@/services/score.service";

export async function getMonthlyReportForUser(userId: string) {
  const { startOfMonth, endOfMonth, daysLeft } = monthBounds();
  const weekAgo = new Date();
  weekAgo.setUTCDate(weekAgo.getUTCDate() - 7);

  const [summary, score, weekAgg, daily] = await Promise.all([
    getDashboardMoneySummary(userId),
    computeFinancialScoreForUser(userId, false),
    prisma.expense.aggregate({
      where: { userId, date: { gte: weekAgo } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.expense.groupBy({
      by: ["date"],
      where: { userId, date: { gte: startOfMonth } },
      _sum: { amount: true },
      orderBy: { date: "asc" },
    }),
  ]);

  return {
    periodStart: startOfMonth.toISOString().slice(0, 10),
    periodEnd: endOfMonth.toISOString().slice(0, 10),
    daysLeft,
    currency: summary.currency,
    pocketMoney: summary.pocketMoney,
    monthSpent: summary.monthSpent,
    weekSpent: Number(weekAgg._sum.amount ?? 0),
    weekTxnCount: weekAgg._count,
    moneyLeft: summary.moneyLeft,
    safePerDay: summary.safePerDay,
    categories: summary.categories.map((c) => ({
      ...c,
      label:
        EXPENSE_CATEGORY_LABELS[
          c.category as keyof typeof EXPENSE_CATEGORY_LABELS
        ] ?? c.category,
    })),
    daily: daily.map((d) => ({
      date: d.date.toISOString().slice(0, 10),
      amount: Number(d._sum.amount ?? 0),
    })),
    score,
    recent: summary.recent,
  };
}
