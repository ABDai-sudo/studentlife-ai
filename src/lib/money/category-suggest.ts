import type { ExpenseCategory } from "@prisma/client";
import { prisma } from "@/lib/db";
import { EXPENSE_CATEGORIES } from "@/lib/validations/expense";

const RULES: { test: RegExp; category: ExpenseCategory }[] = [
  { test: /swiggy|zomato|mess|canteen|lunch|dinner|breakfast|chai|coffee|pizza|burger|food/i, category: "FOOD" },
  { test: /uber|ola|metro|bus|auto|petrol|fuel|train|rapido/i, category: "TRANSPORT" },
  { test: /hostel|rent|pg\b|electricity|wifi|laundry/i, category: "HOSTEL" },
  { test: /book|tuition|course|exam fee|stationery|xerox|print/i, category: "EDUCATION" },
  { test: /netflix|movie|spotify|game|concert/i, category: "ENTERTAINMENT" },
  { test: /amazon|flipkart|clothes|shopping|myntra/i, category: "SHOPPING" },
  { test: /medic|pharmacy|hospital|clinic/i, category: "HEALTH" },
  { test: /recharge|mobile bill|utility/i, category: "UTILITIES" },
];

export function merchantKey(description: string): string {
  return description.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 80);
}

export function suggestCategoryFromDescription(
  description: string | null | undefined
): ExpenseCategory | null {
  if (!description?.trim()) return null;
  for (const rule of RULES) {
    if (rule.test.test(description)) return rule.category;
  }
  return null;
}

export async function resolveExpenseCategory(
  userId: string,
  input: { category?: string; description?: string | null }
): Promise<(typeof EXPENSE_CATEGORIES)[number]> {
  if (input.category && EXPENSE_CATEGORIES.includes(input.category as (typeof EXPENSE_CATEGORIES)[number])) {
    return input.category as (typeof EXPENSE_CATEGORIES)[number];
  }
  const desc = input.description?.trim();
  if (!desc) return "OTHER";
  const key = merchantKey(desc);
  const remembered = await prisma.expenseCategoryHint.findUnique({
    where: { userId_merchantKey: { userId, merchantKey: key } },
  });
  if (remembered) return remembered.category;
  return suggestCategoryFromDescription(desc) ?? "OTHER";
}

export async function rememberExpenseCategory(
  userId: string,
  description: string | null | undefined,
  category: (typeof EXPENSE_CATEGORIES)[number]
) {
  if (!description?.trim()) return;
  if (category === "OTHER") return;
  const key = merchantKey(description);
  await prisma.expenseCategoryHint.upsert({
    where: { userId_merchantKey: { userId, merchantKey: key } },
    update: { category },
    create: { userId, merchantKey: key, category },
  });
}
