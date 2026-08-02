import type { Plan, Currency, Country, StudentType } from "@prisma/client";

export type { Plan, Currency, Country, StudentType };

export type PublicUser = {
  id: string;
  email: string;
  name: string | null;
  onboardingComplete: boolean;
  plan: Plan;
};

export type EndOfMonthSurvival = {
  moneyLeft: number;
  daysRemaining: number;
  safeDailySpend: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
};

export type FinancialHealthSnapshot = {
  score: number;
  label: string;
  savingsRate: number | null;
  budgetAdherence: number | null;
  spendingDiscipline: number | null;
  goalProgress: number | null;
};
