import { z } from "zod";
import { CURRENCIES, EXPENSE_CATEGORIES } from "@/lib/validations/expense";

export const updateProfileSchema = z
  .object({
    monthlyPocketMoney: z.coerce
      .number()
      .positive("Pocket money must be positive")
      .max(10_000_000)
      .optional(),
    studentType: z.enum(["HOSTEL", "DAY_SCHOLAR"]).optional(),
    primaryGoal: z.string().trim().min(1).max(200).optional(),
    country: z.enum(["IN", "CA", "US", "UK", "AU", "AE"]).optional(),
    currency: z.enum(CURRENCIES).optional(),
    timezone: z.string().trim().min(1).max(64).optional(),
    university: z.string().trim().max(200).optional().or(z.literal("")),
    course: z.string().trim().max(200).optional().or(z.literal("")),
    yearOfStudy: z.coerce.number().int().min(1).max(10).optional().nullable(),
    institutionName: z.string().trim().max(200).optional().or(z.literal("")),
    boardOrUniversity: z.string().trim().max(200).optional().or(z.literal("")),
    classOrSemester: z.string().trim().max(80).optional().or(z.literal("")),
    preferredExplanationLang: z
      .string()
      .trim()
      .max(80)
      .optional()
      .or(z.literal("")),
    preferredUiLanguage: z.string().trim().max(80).optional().or(z.literal("")),
    personalityMode: z
      .enum([
        "PROFESSIONAL",
        "FRIENDLY",
        "CAMPUS_BRO",
        "CHRONICALLY_ONLINE",
        "ACADEMIC_VILLAIN",
      ])
      .optional(),
    themeMode: z.enum(["LIGHT", "DARK", "SYSTEM"]).optional(),
    studyGoal: z.string().trim().max(200).optional().or(z.literal("")),
    dailyStudyMinutes: z.coerce
      .number()
      .int()
      .min(10)
      .max(720)
      .optional()
      .nullable(),
    weakSubjects: z.string().trim().max(500).optional().or(z.literal("")),
    displayName: z.string().trim().max(80).optional().or(z.literal("")),
    shareRecapsEnabled: z.boolean().optional(),
    leaderboardOptIn: z.boolean().optional(),
    avatarPresetId: z.string().trim().max(40).optional().nullable().or(z.literal("")),
    avatarStatus: z.string().trim().max(40).optional().nullable().or(z.literal("")),
    leaderboardShowAvatar: z.boolean().optional(),
  })
  .strict();

export const createGoalSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(100),
    targetAmount: z.coerce.number().positive().max(10_000_000),
    currentAmount: z.coerce.number().min(0).max(10_000_000).default(0),
    currency: z.enum(CURRENCIES).default("INR"),
    monthlyContribution: z.coerce.number().min(0).max(10_000_000).optional(),
    targetDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  })
  .strict();

export const updateGoalSchema = z
  .object({
    title: z.string().trim().min(1).max(100).optional(),
    targetAmount: z.coerce.number().positive().max(10_000_000).optional(),
    currentAmount: z.coerce.number().min(0).max(10_000_000).optional(),
    monthlyContribution: z.coerce.number().min(0).max(10_000_000).optional().nullable(),
    targetDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .nullable(),
    status: z.enum(["ACTIVE", "COMPLETED", "PAUSED", "CANCELLED"]).optional(),
  })
  .strict();

export const contributeGoalSchema = z
  .object({
    amount: z.coerce.number().positive().max(10_000_000),
  })
  .strict();

export const upsertBudgetSchema = z
  .object({
    category: z.enum(EXPENSE_CATEGORIES),
    amount: z.coerce.number().positive().max(10_000_000),
    currency: z.enum(CURRENCIES).default("INR"),
    period: z.enum(["WEEKLY", "MONTHLY", "SEMESTER"]).default("MONTHLY"),
  })
  .strict();

export const affordabilitySchema = z
  .object({
    itemName: z.string().trim().min(1).max(120),
    itemCost: z.coerce.number().positive().max(10_000_000),
  })
  .strict();

export const aiCoachSchema = z
  .object({
    message: z.string().trim().min(1).max(1000),
  })
  .strict();

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type ContributeGoalInput = z.infer<typeof contributeGoalSchema>;
export type UpsertBudgetInput = z.infer<typeof upsertBudgetSchema>;
export type AffordabilityInput = z.infer<typeof affordabilitySchema>;
export type AiCoachInput = z.infer<typeof aiCoachSchema>;
