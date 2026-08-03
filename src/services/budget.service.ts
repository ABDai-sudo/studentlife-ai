import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { monthBounds } from "@/lib/money";
import type { UpsertBudgetInput } from "@/lib/validations/finance";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/validations/expense";

export type BudgetDto = {
  id: string;
  category: string;
  categoryLabel: string;
  amount: number;
  currency: string;
  period: string;
  startDate: string;
  spent: number;
  remaining: number;
  percentUsed: number;
};

function label(category: string) {
  return (
    EXPENSE_CATEGORY_LABELS[
      category as keyof typeof EXPENSE_CATEGORY_LABELS
    ] ?? category
  );
}

export async function listBudgetsForUser(userId: string): Promise<BudgetDto[]> {
  const { startOfMonth } = monthBounds();
  const budgets = await prisma.budget.findMany({
    where: {
      userId,
      period: "MONTHLY",
      startDate: { lte: startOfMonth },
      OR: [{ endDate: null }, { endDate: { gte: startOfMonth } }],
    },
    orderBy: { category: "asc" },
  });

  // Prefer latest budget per category for this month window
  const byCategory = new Map<string, (typeof budgets)[number]>();
  for (const b of budgets) {
    const prev = byCategory.get(b.category);
    if (!prev || b.startDate > prev.startDate) byCategory.set(b.category, b);
  }
  const latest = [...byCategory.values()];

  const spentGroups = await prisma.expense.groupBy({
    by: ["category"],
    where: { userId, date: { gte: startOfMonth } },
    _sum: { amount: true },
  });
  const spentMap = new Map(
    spentGroups.map((g) => [g.category, Number(g._sum.amount ?? 0)])
  );

  return latest.map((b) => {
    const amount = Number(b.amount);
    const spent = spentMap.get(b.category) ?? 0;
    return {
      id: b.id,
      category: b.category,
      categoryLabel: label(b.category),
      amount,
      currency: b.currency,
      period: b.period,
      startDate: b.startDate.toISOString().slice(0, 10),
      spent,
      remaining: Math.max(0, amount - spent),
      percentUsed: amount > 0 ? Math.min(100, Math.round((spent / amount) * 100)) : 0,
    };
  });
}

export async function upsertBudgetForUser(
  userId: string,
  input: UpsertBudgetInput
): Promise<BudgetDto> {
  const { startOfMonth } = monthBounds();

  const existing = await prisma.budget.findFirst({
    where: {
      userId,
      category: input.category,
      period: input.period,
      startDate: startOfMonth,
    },
  });

  const row = existing
    ? await prisma.budget.update({
        where: { id: existing.id },
        data: {
          amount: new Prisma.Decimal(input.amount.toFixed(2)),
          currency: input.currency,
        },
      })
    : await prisma.budget.create({
        data: {
          userId,
          category: input.category,
          amount: new Prisma.Decimal(input.amount.toFixed(2)),
          currency: input.currency,
          period: input.period,
          startDate: startOfMonth,
        },
      });

  const list = await listBudgetsForUser(userId);
  const dto = list.find((b) => b.id === row.id);
  if (dto) return dto;

  return {
    id: row.id,
    category: row.category,
    categoryLabel: label(row.category),
    amount: Number(row.amount),
    currency: row.currency,
    period: row.period,
    startDate: row.startDate.toISOString().slice(0, 10),
    spent: 0,
    remaining: Number(row.amount),
    percentUsed: 0,
  };
}

export async function deleteBudgetForUser(
  userId: string,
  budgetId: string
): Promise<boolean> {
  const existing = await prisma.budget.findFirst({
    where: { id: budgetId, userId },
    select: { id: true },
  });
  if (!existing) return false;
  await prisma.budget.delete({ where: { id: budgetId } });
  return true;
}
