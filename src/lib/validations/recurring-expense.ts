import { z } from "zod";
import { CURRENCIES, EXPENSE_CATEGORIES } from "@/lib/validations/expense";

export const createRecurringExpenseSchema = z
  .object({
    amount: z.coerce.number().positive().max(1_000_000),
    currency: z.enum(CURRENCIES).default("INR"),
    category: z.enum(EXPENSE_CATEGORIES),
    description: z.string().trim().max(200).optional().or(z.literal("")),
    dayOfMonth: z.coerce.number().int().min(1).max(28),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .nullable(),
    active: z.boolean().optional(),
    mode: z.enum(["NECESSITY", "EXPENSE"]),
  })
  .strict();

export const updateRecurringExpenseSchema = createRecurringExpenseSchema
  .partial()
  .strict();

export type CreateRecurringExpenseInput = z.infer<
  typeof createRecurringExpenseSchema
>;
