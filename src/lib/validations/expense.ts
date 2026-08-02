import { z } from "zod";

export const EXPENSE_CATEGORIES = [
  "FOOD",
  "TRANSPORT",
  "HOSTEL",
  "EDUCATION",
  "ENTERTAINMENT",
  "SHOPPING",
  "HEALTH",
  "UTILITIES",
  "PERSONAL",
  "OTHER",
] as const;

export const CURRENCIES = ["INR", "USD", "GBP", "EUR", "AED"] as const;

export const createExpenseSchema = z
  .object({
    amount: z.coerce.number().positive("Amount must be greater than 0").max(1_000_000),
    currency: z.enum(CURRENCIES).default("INR"),
    category: z.enum(EXPENSE_CATEGORIES),
    description: z
      .string()
      .trim()
      .max(200, "Description is too long")
      .optional()
      .or(z.literal("")),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date (YYYY-MM-DD)")
      .optional(),
  })
  .strict();

export const listExpensesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  category: z.enum([...EXPENSE_CATEGORIES, "ALL"] as const).optional(),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type ListExpensesInput = z.infer<typeof listExpensesSchema>;

export const EXPENSE_CATEGORY_LABELS: Record<
  (typeof EXPENSE_CATEGORIES)[number],
  string
> = {
  FOOD: "Food",
  TRANSPORT: "Transport",
  HOSTEL: "Hostel",
  EDUCATION: "Education",
  ENTERTAINMENT: "Entertainment",
  SHOPPING: "Shopping",
  HEALTH: "Health",
  UTILITIES: "Utilities",
  PERSONAL: "Personal",
  OTHER: "Other",
};
