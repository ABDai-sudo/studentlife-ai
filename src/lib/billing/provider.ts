import type { Plan } from "@prisma/client";

export type CheckoutPlan = Extract<Plan, "PRO_MONTHLY" | "PRO_YEARLY">;

export type ProviderCheckout = {
  providerSessionId: string;
  checkoutUrl: string;
  expiresAt: Date | null;
};

export type NormalizedBillingEvent = {
  providerEventId: string;
  type:
    | "checkout.completed"
    | "subscription.created"
    | "subscription.renewed"
    | "subscription.updated"
    | "payment.failed"
    | "payment.unpaid"
    | "subscription.cancelled"
    | "subscription.resumed"
    | "subscription.expired";
  eventCreatedAt: Date;
  userId?: string | null;
  checkoutSessionId?: string | null;
  customerId?: string | null;
  subscriptionId?: string | null;
  plan?: CheckoutPlan | null;
  status?: string | null;
  periodStart?: Date | null;
  periodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
  paymentError?: string | null;
  payload: unknown;
};

export type BillingProviderKind = "none" | "dev" | "stripe";

export class BillingConfigRequiredError extends Error {
  readonly code = "PAYMENT_PROVIDER_CONFIG_REQUIRED" as const;
  constructor(message = "PAYMENT_PROVIDER_CONFIG_REQUIRED") {
    super(message);
    this.name = "BillingConfigRequiredError";
  }
}

export interface BillingProvider {
  kind: Exclude<BillingProviderKind, "none">;
  createCheckout(input: {
    userId: string;
    email: string;
    plan: CheckoutPlan;
    successUrl: string;
    cancelUrl: string;
  }): Promise<ProviderCheckout>;
  cancelSubscription(providerSubscriptionId: string): Promise<void>;
  resumeSubscription(providerSubscriptionId: string): Promise<void>;
  verifyWebhook(
    rawBody: string,
    headers: Headers
  ): Promise<NormalizedBillingEvent[]>;
}

export function resolveBillingProviderKind(
  env: NodeJS.ProcessEnv = process.env
): BillingProviderKind {
  const forced = (env.BILLING_PROVIDER || "").trim().toLowerCase();
  if (forced === "dev") {
    if (env.NODE_ENV === "production") return "none";
    return "dev";
  }
  if (forced === "stripe") {
    return stripeConfigured(env) ? "stripe" : "none";
  }
  return "none";
}

export function stripeConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(
    env.STRIPE_SECRET_KEY?.trim() &&
      env.STRIPE_WEBHOOK_SECRET?.trim() &&
      env.STRIPE_PRICE_PRO_MONTHLY?.trim() &&
      env.STRIPE_PRICE_PRO_YEARLY?.trim()
  );
}
