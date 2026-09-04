import { z } from "zod";

export const signupSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long")
    .regex(/[A-Za-z]/, "Password must include a letter")
    .regex(/[0-9]/, "Password must include a number"),
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name is too long")
    .optional(),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const onboardingSchema = z.object({
  monthlyPocketMoney: z.coerce.number().positive("Pocket money must be positive"),
  studentType: z.enum(["HOSTEL", "DAY_SCHOLAR"]),
  primaryGoal: z.string().trim().min(1).max(200),
  country: z.enum(["IN", "CA", "US", "UK", "AU", "AE"]).default("IN"),
  currency: z.enum(["INR", "USD", "GBP", "EUR", "AED"]).default("INR"),
  university: z.string().trim().max(200).optional(),
  course: z.string().trim().max(200).optional(),
  yearOfStudy: z.coerce.number().int().min(1).max(10).optional(),
  institutionName: z.string().trim().max(200).optional(),
  classOrSemester: z.string().trim().max(80).optional(),
  studyGoal: z.string().trim().max(200).optional(),
  preferredExplanationLang: z.string().trim().max(80).optional(),
  preferredUiLanguage: z.string().trim().max(80).optional(),
  personalityMode: z
    .enum([
      "PROFESSIONAL",
      "FRIENDLY",
      "CAMPUS_BRO",
      "CHRONICALLY_ONLINE",
      "ACADEMIC_VILLAIN",
    ])
    .optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
