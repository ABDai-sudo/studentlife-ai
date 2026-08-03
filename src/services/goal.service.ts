import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { parseDateOnly } from "@/lib/money";
import type {
  ContributeGoalInput,
  CreateGoalInput,
  UpdateGoalInput,
} from "@/lib/validations/finance";

export type GoalDto = {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  monthlyContribution: number | null;
  targetDate: string | null;
  estimatedCompletion: string | null;
  status: string;
  progressPercent: number;
  createdAt: string;
};

function toDto(row: {
  id: string;
  title: string;
  targetAmount: Prisma.Decimal;
  currentAmount: Prisma.Decimal;
  currency: string;
  monthlyContribution: Prisma.Decimal | null;
  targetDate: Date | null;
  estimatedCompletion: Date | null;
  status: string;
  createdAt: Date;
}): GoalDto {
  const target = Number(row.targetAmount);
  const current = Number(row.currentAmount);
  return {
    id: row.id,
    title: row.title,
    targetAmount: target,
    currentAmount: current,
    currency: row.currency,
    monthlyContribution:
      row.monthlyContribution != null ? Number(row.monthlyContribution) : null,
    targetDate: row.targetDate?.toISOString().slice(0, 10) ?? null,
    estimatedCompletion:
      row.estimatedCompletion?.toISOString().slice(0, 10) ?? null,
    status: row.status,
    progressPercent:
      target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0,
    createdAt: row.createdAt.toISOString(),
  };
}

function estimateCompletion(
  current: number,
  target: number,
  monthly: number | null | undefined
): Date | null {
  if (!monthly || monthly <= 0 || current >= target) return null;
  const months = Math.ceil((target - current) / monthly);
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

export async function listGoalsForUser(userId: string): Promise<GoalDto[]> {
  const rows = await prisma.savingsGoal.findMany({
    where: { userId, status: { not: "CANCELLED" } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
  return rows.map(toDto);
}

export async function createGoalForUser(
  userId: string,
  input: CreateGoalInput
): Promise<GoalDto> {
  const current = input.currentAmount ?? 0;
  const estimated = estimateCompletion(
    current,
    input.targetAmount,
    input.monthlyContribution
  );

  const row = await prisma.savingsGoal.create({
    data: {
      userId,
      title: input.title.trim(),
      targetAmount: new Prisma.Decimal(input.targetAmount.toFixed(2)),
      currentAmount: new Prisma.Decimal(current.toFixed(2)),
      currency: input.currency,
      monthlyContribution:
        input.monthlyContribution != null
          ? new Prisma.Decimal(input.monthlyContribution.toFixed(2))
          : null,
      targetDate: parseDateOnly(input.targetDate) ?? null,
      estimatedCompletion: estimated,
      status: current >= input.targetAmount ? "COMPLETED" : "ACTIVE",
    },
  });

  return toDto(row);
}

export async function updateGoalForUser(
  userId: string,
  goalId: string,
  input: UpdateGoalInput
): Promise<GoalDto | null> {
  const existing = await prisma.savingsGoal.findFirst({
    where: { id: goalId, userId },
  });
  if (!existing) return null;

  const target =
    input.targetAmount != null
      ? input.targetAmount
      : Number(existing.targetAmount);
  const current =
    input.currentAmount != null
      ? input.currentAmount
      : Number(existing.currentAmount);
  const monthly =
    input.monthlyContribution !== undefined
      ? input.monthlyContribution
      : existing.monthlyContribution != null
        ? Number(existing.monthlyContribution)
        : null;

  const row = await prisma.savingsGoal.update({
    where: { id: goalId },
    data: {
      ...(input.title ? { title: input.title.trim() } : {}),
      ...(input.targetAmount != null
        ? {
            targetAmount: new Prisma.Decimal(input.targetAmount.toFixed(2)),
          }
        : {}),
      ...(input.currentAmount != null
        ? {
            currentAmount: new Prisma.Decimal(input.currentAmount.toFixed(2)),
          }
        : {}),
      ...(input.monthlyContribution !== undefined
        ? {
            monthlyContribution:
              input.monthlyContribution == null
                ? null
                : new Prisma.Decimal(input.monthlyContribution.toFixed(2)),
          }
        : {}),
      ...(input.targetDate !== undefined
        ? {
            targetDate:
              input.targetDate == null
                ? null
                : (parseDateOnly(input.targetDate) ?? null),
          }
        : {}),
      estimatedCompletion: estimateCompletion(current, target, monthly),
      status:
        input.status ??
        (current >= target
          ? "COMPLETED"
          : existing.status === "COMPLETED"
            ? "ACTIVE"
            : existing.status),
    },
  });

  return toDto(row);
}

export async function contributeToGoalForUser(
  userId: string,
  goalId: string,
  input: ContributeGoalInput
): Promise<GoalDto | null> {
  const existing = await prisma.savingsGoal.findFirst({
    where: { id: goalId, userId },
  });
  if (!existing) return null;

  const current = Number(existing.currentAmount) + input.amount;
  const target = Number(existing.targetAmount);
  const monthly =
    existing.monthlyContribution != null
      ? Number(existing.monthlyContribution)
      : null;

  const row = await prisma.savingsGoal.update({
    where: { id: goalId },
    data: {
      currentAmount: new Prisma.Decimal(current.toFixed(2)),
      status: current >= target ? "COMPLETED" : existing.status,
      estimatedCompletion: estimateCompletion(current, target, monthly),
    },
  });

  return toDto(row);
}

export async function deleteGoalForUser(
  userId: string,
  goalId: string
): Promise<boolean> {
  const existing = await prisma.savingsGoal.findFirst({
    where: { id: goalId, userId },
    select: { id: true },
  });
  if (!existing) return false;
  await prisma.savingsGoal.delete({ where: { id: goalId } });
  return true;
}
