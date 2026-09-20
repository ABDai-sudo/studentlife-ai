import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { CreateRecurringExpenseInput } from "@/lib/validations/recurring-expense";

export function monthPeriodKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function occurrenceDateInMonth(
  year: number,
  monthIndex: number,
  dayOfMonth: number
): Date {
  const last = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const day = Math.min(Math.max(1, dayOfMonth), last);
  return new Date(Date.UTC(year, monthIndex, day));
}

function monthBoundsUtc(year: number, monthIndex: number) {
  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 0));
  return { start, end };
}

function activeInMonth(
  item: { startDate: Date; endDate: Date | null; active: boolean },
  start: Date,
  end: Date
) {
  if (!item.active) return false;
  if (item.startDate.getTime() > end.getTime()) return false;
  if (item.endDate && item.endDate.getTime() < start.getTime()) return false;
  return true;
}

export async function listRecurringExpensesForUser(userId: string) {
  return prisma.recurringExpense.findMany({
    where: { userId },
    orderBy: [{ active: "desc" }, { createdAt: "desc" }],
  });
}

export async function createRecurringExpenseForUser(
  userId: string,
  input: CreateRecurringExpenseInput
) {
  const row = await prisma.recurringExpense.create({
    data: {
      userId,
      amount: new Prisma.Decimal(input.amount.toFixed(2)),
      currency: input.currency,
      category: input.category,
      description: input.description?.trim() || null,
      dayOfMonth: input.dayOfMonth,
      startDate: new Date(`${input.startDate}T00:00:00.000Z`),
      endDate: input.endDate ? new Date(`${input.endDate}T00:00:00.000Z`) : null,
      active: input.active ?? true,
      mode: input.mode,
    },
  });
  await materializeRecurringForMonth(userId, new Date());
  return row;
}

export async function updateRecurringExpenseForUser(
  userId: string,
  id: string,
  input: Partial<CreateRecurringExpenseInput> & { active?: boolean }
) {
  const existing = await prisma.recurringExpense.findFirst({
    where: { id, userId },
  });
  if (!existing) return null;
  const updated = await prisma.recurringExpense.update({
    where: { id },
    data: {
      ...(input.amount != null
        ? { amount: new Prisma.Decimal(input.amount.toFixed(2)) }
        : {}),
      ...(input.currency ? { currency: input.currency } : {}),
      ...(input.category ? { category: input.category } : {}),
      ...(input.description !== undefined
        ? { description: input.description?.trim() || null }
        : {}),
      ...(input.dayOfMonth != null ? { dayOfMonth: input.dayOfMonth } : {}),
      ...(input.startDate
        ? { startDate: new Date(`${input.startDate}T00:00:00.000Z`) }
        : {}),
      ...(input.endDate !== undefined
        ? {
            endDate: input.endDate
              ? new Date(`${input.endDate}T00:00:00.000Z`)
              : null,
          }
        : {}),
      ...(input.active != null ? { active: input.active } : {}),
      ...(input.mode ? { mode: input.mode } : {}),
    },
  });
  return updated;
}

export async function deleteRecurringExpenseForUser(userId: string, id: string) {
  const existing = await prisma.recurringExpense.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!existing) return false;
  await prisma.recurringExpense.delete({ where: { id } });
  return true;
}

export async function necessaryCommittedFromRecurring(
  userId: string,
  asOf = new Date()
): Promise<number> {
  const year = asOf.getUTCFullYear();
  const monthIndex = asOf.getUTCMonth();
  const { start, end } = monthBoundsUtc(year, monthIndex);
  const items = await prisma.recurringExpense.findMany({
    where: { userId, mode: "NECESSITY", active: true },
  });
  return items
    .filter((item) => activeInMonth(item, start, end))
    .reduce((sum, item) => sum + Number(item.amount), 0);
}

export async function materializeRecurringForMonth(
  userId: string,
  asOf = new Date()
): Promise<{ created: number; reused: number }> {
  const year = asOf.getUTCFullYear();
  const monthIndex = asOf.getUTCMonth();
  const periodKey = monthPeriodKey(asOf);
  const { start, end } = monthBoundsUtc(year, monthIndex);
  const items = await prisma.recurringExpense.findMany({
    where: { userId },
  });

  let created = 0;
  let reused = 0;

  for (const item of items) {
    if (!activeInMonth(item, start, end)) continue;
    const existing = await prisma.recurringExpenseOccurrence.findUnique({
      where: {
        recurringExpenseId_periodKey: {
          recurringExpenseId: item.id,
          periodKey,
        },
      },
    });
    if (existing) {
      reused += 1;
      continue;
    }

    const date = occurrenceDateInMonth(year, monthIndex, item.dayOfMonth);
    const amount = Number(item.amount);
    let expenseId: string | null = null;

    if (item.mode === "EXPENSE") {
      const clientRequestId = `recurring:${item.id}:${periodKey}`;
      const existingExpense = await prisma.expense.findFirst({
        where: { userId, clientRequestId },
      });
      if (existingExpense) {
        expenseId = existingExpense.id;
      } else {
        try {
          const expense = await prisma.expense.create({
            data: {
              userId,
              amount: new Prisma.Decimal(amount.toFixed(2)),
              currency: item.currency,
              category: item.category,
              description: item.description,
              date,
              clientRequestId,
              recurringExpenseId: item.id,
              countsTowardSpend: true,
            },
          });
          expenseId = expense.id;
        } catch (error) {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
          ) {
            const dup = await prisma.expense.findFirst({
              where: { userId, clientRequestId },
            });
            expenseId = dup?.id ?? null;
          } else {
            throw error;
          }
        }
      }
    }

    try {
      await prisma.recurringExpenseOccurrence.create({
        data: {
          recurringExpenseId: item.id,
          userId,
          periodKey,
          amount: new Prisma.Decimal(amount.toFixed(2)),
          expenseId,
        },
      });
      created += 1;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        reused += 1;
        continue;
      }
      throw error;
    }
  }

  return { created, reused };
}
