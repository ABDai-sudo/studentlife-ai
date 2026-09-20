import type { Plan, SubscriptionStatus } from "@prisma/client";

export type BillingPlan = "FREE" | "PREMIUM" | "PRO_MONTHLY" | "PRO_YEARLY";

export type EntitlementFeature =
  | "higher_ai_limits"
  | "larger_uploads"
  | "advanced_mock_exam"
  | "full_assignment_draft"
  | "advanced_recap";

export const PAID_PLANS: readonly BillingPlan[] = [
  "PREMIUM",
  "PRO_MONTHLY",
  "PRO_YEARLY",
];

export const ADVANCED_PAPER_MODES = new Set([
  "INTERNAL_EXAM",
  "SEMESTER_MOCK",
  "PRACTICAL_EXAM",
]);

export const PRO_ASSIGNMENT_MODES = new Set(["FULL_DRAFT", "EXAM_STYLE"]);

export const LIMITS = {
  tutorPerHourFree: 40,
  tutorPerHourPro: 120,
  assignPerHourFree: 20,
  assignPerHourPro: 60,
  paperPerHourFree: 15,
  paperPerHourPro: 40,
  uploadBytesFree: 5_000_000,
  uploadBytesPro: 25_000_000,
} as const;

/** Explicit PAST_DUE grace: 3 days from failure, persisted as graceUntil. */
export const PAST_DUE_GRACE_MS = 3 * 24 * 60 * 60 * 1000;

export type SubscriptionSnapshot = {
  plan: Plan | BillingPlan;
  status: SubscriptionStatus | string;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd?: boolean;
  graceUntil?: Date | null;
};

export function isPaidPlan(plan: string): boolean {
  return (PAID_PLANS as readonly string[]).includes(plan);
}

export function computePastDueGraceUntil(
  failedAt: Date,
  periodEnd: Date | null
): Date {
  const grace = new Date(failedAt.getTime() + PAST_DUE_GRACE_MS);
  if (periodEnd && periodEnd.getTime() < grace.getTime()) return periodEnd;
  return grace;
}

function periodStillOpen(
  sub: SubscriptionSnapshot,
  now: Date
): boolean {
  if (!sub.currentPeriodEnd) return true;
  return sub.currentPeriodEnd.getTime() >= now.getTime();
}

export function hasPaidAccess(
  sub: SubscriptionSnapshot | null | undefined,
  now = new Date()
): boolean {
  if (!sub || !isPaidPlan(String(sub.plan))) return false;
  const status = String(sub.status).toUpperCase();
  if (
    status === "INCOMPLETE" ||
    status === "EXPIRED" ||
    status === "UNPAID" ||
    status === "CANCELLED" ||
    status === "CANCELED"
  ) {
    return false;
  }
  if (!periodStillOpen(sub, now)) return false;

  if (status === "ACTIVE" || status === "TRIAL" || status === "TRIALING") {
    return true;
  }

  if (status === "PAST_DUE") {
    return Boolean(sub.graceUntil && sub.graceUntil.getTime() > now.getTime());
  }

  return false;
}

export function publicPlan(sub: SubscriptionSnapshot | null | undefined): BillingPlan {
  if (!hasPaidAccess(sub)) return "FREE";
  const plan = String(sub?.plan);
  if (plan === "PRO_YEARLY") return "PRO_YEARLY";
  if (plan === "PRO_MONTHLY") return "PRO_MONTHLY";
  if (plan === "PREMIUM") return "PREMIUM";
  return "FREE";
}

export function featureAllowed(
  feature: EntitlementFeature,
  entitled: boolean
): boolean {
  if (!entitled) {
    return (
      feature !== "higher_ai_limits" &&
      feature !== "larger_uploads" &&
      feature !== "advanced_mock_exam" &&
      feature !== "full_assignment_draft" &&
      feature !== "advanced_recap"
    );
  }
  return true;
}
