import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getDashboardMoneySummary } from "@/services/expense.service";
import type { AffordabilityInput } from "@/lib/validations/finance";

export type AffordabilityResult = {
  id: string;
  itemName: string;
  itemCost: number;
  currency: string;
  verdict: "yes" | "caution" | "no";
  moneyLeft: number | null;
  daysLeft: number;
  safePerDayBefore: number | null;
  safePerDayAfter: number | null;
  monthsToAfford: number;
  tips: string[];
  fasterScenarios: { label: string; months: number; action: string }[];
};

export async function checkAffordabilityForUser(
  userId: string,
  input: AffordabilityInput
): Promise<AffordabilityResult> {
  const summary = await getDashboardMoneySummary(userId);
  const moneyLeft = summary.moneyLeft;
  const daysLeft = summary.daysLeft;
  const safeBefore = summary.safePerDay;
  const cost = input.itemCost;

  let verdict: "yes" | "caution" | "no" = "no";
  let safeAfter: number | null = null;
  const tips: string[] = [];

  if (moneyLeft == null) {
    tips.push("Set your monthly pocket money first so we can check this properly.");
  } else if (cost > moneyLeft) {
    verdict = "no";
    tips.push("This costs more than your money left this month.");
  } else {
    safeAfter = Math.floor(((moneyLeft - cost) / daysLeft) * 100) / 100;
    const share = cost / moneyLeft;
    if (share <= 0.15 && (safeBefore == null || safeAfter >= safeBefore * 0.7)) {
      verdict = "yes";
      tips.push("This looks affordable without wrecking the rest of the month.");
    } else if (share <= 0.35) {
      verdict = "caution";
      tips.push(
        `Buying this drops safe daily spend from ${safeBefore ?? "—"} to about ${safeAfter}.`
      );
      tips.push("Consider waiting for next pocket-money cycle if food/travel is tight.");
    } else {
      verdict = "no";
      tips.push("This would use too much of your remaining money for one purchase.");
    }
  }

  const goals = await prisma.savingsGoal.findMany({
    where: { userId, status: "ACTIVE" },
    select: { monthlyContribution: true, currentAmount: true, targetAmount: true },
  });
  const monthlySavings =
    goals.reduce((sum, g) => sum + Number(g.monthlyContribution ?? 0), 0) ||
    Math.max(0, (summary.pocketMoney ?? 0) * 0.1);

  const currentSavings = goals.reduce(
    (sum, g) => sum + Number(g.currentAmount),
    0
  );
  const stillNeeded = Math.max(0, cost - currentSavings);
  const monthsToAfford =
    stillNeeded <= 0
      ? 0
      : monthlySavings > 0
        ? Math.ceil(stillNeeded / monthlySavings)
        : 99;

  const fasterScenarios = [
    {
      label: "Save a bit more each week",
      months: Math.max(1, Math.ceil(stillNeeded / Math.max(monthlySavings * 1.25, 1))),
      action: "Raise weekly savings by ~25%",
    },
    {
      label: "Pause entertainment for 2 weeks",
      months: Math.max(1, Math.ceil(stillNeeded / Math.max(monthlySavings * 1.5, 1))),
      action: "Redirect entertainment budget to this buy",
    },
  ];

  const saved = await prisma.affordabilityCheck.create({
    data: {
      userId,
      itemName: input.itemName.trim(),
      itemCost: new Prisma.Decimal(cost.toFixed(2)),
      currentSavings: new Prisma.Decimal(currentSavings.toFixed(2)),
      monthlySavings: new Prisma.Decimal(monthlySavings.toFixed(2)),
      monthsToAfford,
      fasterScenarios,
      currency: summary.currency as "INR" | "USD" | "GBP" | "EUR" | "AED",
    },
  });

  return {
    id: saved.id,
    itemName: input.itemName.trim(),
    itemCost: cost,
    currency: summary.currency,
    verdict,
    moneyLeft,
    daysLeft,
    safePerDayBefore: safeBefore,
    safePerDayAfter: safeAfter,
    monthsToAfford,
    tips,
    fasterScenarios,
  };
}
