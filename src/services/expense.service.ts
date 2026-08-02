import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type {
  CreateExpenseInput,
  ListExpensesInput,
} from "@/lib/validations/expense";
import { trackAnalyticsEvent } from "@/services/analytics.service";

export type ExpenseDto = {
  id: string;
  amount: number;
  currency: string;
  category: string;
  description: string | null;
  date: string;
  createdAt: string;
};

function toDto(row: {
  id: string;
  amount: Prisma.Decimal;
  currency: string;
  category: string;
  description: string | null;
  date: Date;
  createdAt: Date;
}): ExpenseDto {
  return {
    id: row.id,
    amount: Number(row.amount),
    currency: row.currency,
    category: row.category,
    description: row.description,
    date: row.date.toISOString().slice(0, 10),
    createdAt: row.createdAt.toISOString(),
  };
}

function parseDateOnly(value?: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return undefined;
  return d;
}

export async function createExpenseForUser(
  userId: string,
  input: CreateExpenseInput
): Promise<ExpenseDto> {
  const date = parseDateOnly(input.date) ?? new Date();
  const description =
    input.description && input.description.trim().length > 0
      ? input.description.trim()
      : null;

  const expense = await prisma.expense.create({
    data: {
      userId,
      amount: new Prisma.Decimal(input.amount.toFixed(2)),
      currency: input.currency,
      category: input.category,
      description,
      date,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { lastActiveAt: new Date() },
  });

  void trackAnalyticsEvent(
    {
      eventName: "expense_module_opened",
      metadata: { action: "created" },
    },
    userId
  );

  return toDto(expense);
}

export async function listExpensesForUser(
  userId: string,
  query: ListExpensesInput
): Promise<{
  expenses: ExpenseDto[];
  page: number;
  pageSize: number;
  total: number;
  summary: {
    monthTotal: number;
    todayTotal: number;
    topCategory: string | null;
  };
}> {
  const { page, pageSize, category, from, to } = query;

  const where: Prisma.ExpenseWhereInput = {
    userId,
    ...(category && category !== "ALL" ? { category } : {}),
    ...(from || to
      ? {
          date: {
            ...(from ? { gte: parseDateOnly(from) } : {}),
            ...(to ? { lte: parseDateOnly(to) } : {}),
          },
        }
      : {}),
  };

  const now = new Date();
  const startOfMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  );
  const startOfToday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );

  const [total, rows, monthAgg, todayAgg, categoryGroups] = await Promise.all([
    prisma.expense.count({ where }),
    prisma.expense.findMany({
      where,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.expense.aggregate({
      where: { userId, date: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: { userId, date: { gte: startOfToday } },
      _sum: { amount: true },
    }),
    prisma.expense.groupBy({
      by: ["category"],
      where: { userId, date: { gte: startOfMonth } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 1,
    }),
  ]);

  return {
    expenses: rows.map(toDto),
    page,
    pageSize,
    total,
    summary: {
      monthTotal: Number(monthAgg._sum.amount ?? 0),
      todayTotal: Number(todayAgg._sum.amount ?? 0),
      topCategory: categoryGroups[0]?.category ?? null,
    },
  };
}

export async function deleteExpenseForUser(
  userId: string,
  expenseId: string
): Promise<boolean> {
  const existing = await prisma.expense.findFirst({
    where: { id: expenseId, userId },
    select: { id: true },
  });
  if (!existing) return false;

  await prisma.expense.delete({ where: { id: expenseId } });
  return true;
}

export async function getDashboardMoneySummary(userId: string) {
  const now = new Date();
  const startOfMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  );
  const startOfToday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const endOfMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)
  );
  const daysLeft = Math.max(
    1,
    endOfMonth.getUTCDate() - now.getUTCDate() + 1
  );

  const [profile, monthAgg, todayAgg, categoryGroups, recent] =
    await Promise.all([
      prisma.studentProfile.findUnique({
        where: { userId },
        select: { monthlyPocketMoney: true, currency: true },
      }),
      prisma.expense.aggregate({
        where: { userId, date: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: { userId, date: { gte: startOfToday } },
        _sum: { amount: true },
      }),
      prisma.expense.groupBy({
        by: ["category"],
        where: { userId, date: { gte: startOfMonth } },
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
        take: 5,
      }),
      prisma.expense.findMany({
        where: { userId },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        take: 5,
      }),
    ]);

  const monthSpent = Number(monthAgg._sum.amount ?? 0);
  const todaySpent = Number(todayAgg._sum.amount ?? 0);
  const pocket =
    profile?.monthlyPocketMoney != null
      ? Number(profile.monthlyPocketMoney)
      : null;
  const moneyLeft = pocket != null ? Math.max(0, pocket - monthSpent) : null;
  const safePerDay =
    moneyLeft != null ? Math.floor((moneyLeft / daysLeft) * 100) / 100 : null;

  const categoryTotal = categoryGroups.reduce(
    (sum, g) => sum + Number(g._sum.amount ?? 0),
    0
  );

  return {
    available: true,
    currency: profile?.currency ?? "INR",
    pocketMoney: pocket,
    monthSpent,
    todaySpent,
    moneyLeft,
    daysLeft,
    safePerDay,
    categories: categoryGroups.map((g) => ({
      category: g.category,
      amount: Number(g._sum.amount ?? 0),
      percent:
        categoryTotal > 0
          ? Math.round((Number(g._sum.amount ?? 0) / categoryTotal) * 100)
          : 0,
    })),
    recent: recent.map(toDto),
  };
}
