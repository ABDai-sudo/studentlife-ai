import {
  BillingCheckoutStatus,
  BillingProviderName,
  Plan,
  Prisma,
  type Subscription,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  computePastDueGraceUntil,
  hasPaidAccess,
  publicPlan,
  LIMITS,
} from "@/lib/billing/entitlements";
import {
  BillingConfigRequiredError,
  resolveBillingProviderKind,
  type BillingProvider,
  type CheckoutPlan,
  type NormalizedBillingEvent,
} from "@/lib/billing/provider";
import { stripeBillingProvider } from "@/lib/billing/stripe-provider";
import { devBillingProvider, periodFor } from "@/lib/billing/dev-provider";

export function getBillingProvider(): BillingProvider {
  const kind = resolveBillingProviderKind();
  if (kind === "stripe") return stripeBillingProvider;
  if (kind === "dev") return devBillingProvider;
  throw new BillingConfigRequiredError();
}

export function providerEnum(): BillingProviderName {
  const kind = resolveBillingProviderKind();
  if (kind === "stripe") return "STRIPE";
  if (kind === "dev") return "DEV";
  return "NONE";
}

export async function getSubscriptionForUser(userId: string) {
  return prisma.subscription.findFirst({
    where: { userId },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
  });
}

export async function userHasPaidAccess(userId: string): Promise<boolean> {
  const sub = await getSubscriptionForUser(userId);
  return hasPaidAccess(sub);
}

export async function entitledPlanForUser(userId: string) {
  const sub = await getSubscriptionForUser(userId);
  return publicPlan(sub);
}

export async function requirePaidAccess(userId: string) {
  const entitled = await userHasPaidAccess(userId);
  if (!entitled) {
    const err = new Error("ENTITLEMENT_REQUIRED");
    err.name = "EntitlementError";
    throw err;
  }
  return true;
}

export async function uploadLimitBytes(userId: string): Promise<number> {
  return (await userHasPaidAccess(userId))
    ? LIMITS.uploadBytesPro
    : LIMITS.uploadBytesFree;
}

export async function aiRateLimit(userId: string, kind: "tutor" | "assign" | "paper") {
  const pro = await userHasPaidAccess(userId);
  if (kind === "tutor") {
    return { limit: pro ? LIMITS.tutorPerHourPro : LIMITS.tutorPerHourFree, windowSec: 3600 };
  }
  if (kind === "assign") {
    return { limit: pro ? LIMITS.assignPerHourPro : LIMITS.assignPerHourFree, windowSec: 3600 };
  }
  return { limit: pro ? LIMITS.paperPerHourPro : LIMITS.paperPerHourFree, windowSec: 3600 };
}

export async function getBillingSnapshot(userId: string) {
  const sub = await getSubscriptionForUser(userId);
  const kind = resolveBillingProviderKind();
  return {
    provider: kind,
    configured: kind !== "none",
    plan: publicPlan(sub),
    entitled: hasPaidAccess(sub),
    status: sub?.status ?? "ACTIVE",
    cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
    currentPeriodStart: sub?.currentPeriodStart?.toISOString() ?? null,
    currentPeriodEnd: sub?.currentPeriodEnd?.toISOString() ?? null,
    lastPaymentError: sub?.lastPaymentError ?? null,
    graceUntil: sub?.graceUntil?.toISOString() ?? null,
    configCode: kind === "none" ? "PAYMENT_PROVIDER_CONFIG_REQUIRED" : null,
  };
}

export async function startCheckout(input: {
  userId: string;
  email: string;
  plan: CheckoutPlan;
  successUrl: string;
  cancelUrl: string;
}) {
  const provider = getBillingProvider();
  const created = await provider.createCheckout(input);
  await prisma.billingCheckoutSession.create({
    data: {
      userId: input.userId,
      plan: input.plan,
      status: "OPEN",
      provider: providerEnum(),
      providerSessionId: created.providerSessionId,
      checkoutUrl: created.checkoutUrl,
      expiresAt: created.expiresAt,
    },
  });
  return created;
}

export async function requestCancel(userId: string) {
  const sub = await getSubscriptionForUser(userId);
  if (!sub?.providerSubscriptionId) {
    throw new Error("NO_PROVIDER_SUBSCRIPTION");
  }
  const provider = getBillingProvider();
  await provider.cancelSubscription(sub.providerSubscriptionId);
  await prisma.subscription.update({
    where: { id: sub.id },
    data: { cancelAtPeriodEnd: true },
  });
}

export async function requestResume(userId: string) {
  const sub = await getSubscriptionForUser(userId);
  if (!sub?.providerSubscriptionId) {
    throw new Error("NO_PROVIDER_SUBSCRIPTION");
  }
  const provider = getBillingProvider();
  await provider.resumeSubscription(sub.providerSubscriptionId);
  await prisma.subscription.update({
    where: { id: sub.id },
    data: { cancelAtPeriodEnd: false, status: "ACTIVE", cancelledAt: null },
  });
}

export async function applyBillingEvent(
  provider: BillingProviderName,
  event: NormalizedBillingEvent
): Promise<{ duplicate: boolean; skipped: string | null }> {
  try {
    await prisma.billingWebhookEvent.create({
      data: {
        userId: event.userId || null,
        provider,
        providerEventId: event.providerEventId,
        type: event.type,
        payload: event.payload as Prisma.InputJsonValue,
        eventCreatedAt: event.eventCreatedAt,
        processedAt: new Date(),
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { duplicate: true, skipped: "duplicate_event" };
    }
    throw error;
  }

  const userId = await resolveUserId(event);
  if (!userId) {
    await prisma.billingWebhookEvent.update({
      where: {
        provider_providerEventId: {
          provider,
          providerEventId: event.providerEventId,
        },
      },
      data: { skippedReason: "user_not_resolved" },
    });
    return { duplicate: false, skipped: "user_not_resolved" };
  }

  const sub = await getSubscriptionForUser(userId);
  if (
    sub?.lastProviderEventAt &&
    event.eventCreatedAt.getTime() < sub.lastProviderEventAt.getTime()
  ) {
    await prisma.billingWebhookEvent.update({
      where: {
        provider_providerEventId: {
          provider,
          providerEventId: event.providerEventId,
        },
      },
      data: { skippedReason: "out_of_order", userId },
    });
    return { duplicate: false, skipped: "out_of_order" };
  }

  await applyEventToSubscription(userId, sub, provider, event);
  return { duplicate: false, skipped: null };
}

async function resolveUserId(event: NormalizedBillingEvent): Promise<string | null> {
  if (event.userId) return event.userId;
  if (event.checkoutSessionId) {
    const session = await prisma.billingCheckoutSession.findUnique({
      where: { providerSessionId: event.checkoutSessionId },
    });
    if (session) return session.userId;
  }
  if (event.subscriptionId) {
    const sub = await prisma.subscription.findFirst({
      where: { providerSubscriptionId: event.subscriptionId },
    });
    if (sub) return sub.userId;
  }
  if (event.customerId) {
    const sub = await prisma.subscription.findFirst({
      where: { providerCustomerId: event.customerId },
    });
    if (sub) return sub.userId;
  }
  return null;
}

async function applyEventToSubscription(
  userId: string,
  existing: Subscription | null,
  provider: BillingProviderName,
  event: NormalizedBillingEvent
) {
  const checkoutPlan = await planFromEvent(event);
  const period =
    event.periodStart && event.periodEnd
      ? { start: event.periodStart, end: event.periodEnd }
      : existing?.currentPeriodStart && existing.currentPeriodEnd
        ? { start: existing.currentPeriodStart, end: existing.currentPeriodEnd }
        : checkoutPlan
          ? periodFor(checkoutPlan)
          : periodFor("PRO_MONTHLY");

  const paidPlan = checkoutPlan || (isCheckoutPlan(existing?.plan) ? existing.plan : "PRO_MONTHLY");

  if (event.checkoutSessionId) {
    await prisma.billingCheckoutSession.updateMany({
      where: { providerSessionId: event.checkoutSessionId },
      data: { status: "COMPLETE" as BillingCheckoutStatus },
    });
  }

  const base = {
    provider,
    lastProviderEventAt: event.eventCreatedAt,
    lastProviderEventId: event.providerEventId,
    providerCustomerId: event.customerId ?? existing?.providerCustomerId,
    providerSubscriptionId:
      event.subscriptionId ?? existing?.providerSubscriptionId,
  };

  if (event.type === "payment.failed") {
    await upsertPaidSubscription(userId, existing, {
      ...base,
      plan: existing && isCheckoutPlan(existing.plan) ? existing.plan : paidPlan,
      status: "PAST_DUE",
      lastPaymentError: event.paymentError || "payment_failed",
      currentPeriodStart: period.start,
      currentPeriodEnd: period.end,
      graceUntil: computePastDueGraceUntil(new Date(), period.end),
    });
    return;
  }

  if (event.type === "payment.unpaid") {
    await upsertPaidSubscription(userId, existing, {
      ...base,
      plan: existing && isCheckoutPlan(existing.plan) ? existing.plan : paidPlan,
      status: "UNPAID",
      lastPaymentError: event.paymentError || "unpaid",
      currentPeriodStart: period.start,
      currentPeriodEnd: period.end,
      graceUntil: null,
    });
    return;
  }

  if (event.type === "subscription.expired") {
    await upsertPaidSubscription(userId, existing, {
      ...base,
      plan: paidPlan,
      status: "EXPIRED",
      cancelAtPeriodEnd: false,
      currentPeriodStart: period.start,
      currentPeriodEnd: period.end,
      lastPaymentError: null,
      graceUntil: null,
    });
    return;
  }

  if (event.type === "subscription.cancelled") {
    const stillCovered = period.end.getTime() > Date.now();
    await upsertPaidSubscription(userId, existing, {
      ...base,
      plan: paidPlan,
      status: stillCovered ? "ACTIVE" : "CANCELLED",
      cancelAtPeriodEnd: stillCovered,
      cancelledAt: new Date(),
      currentPeriodStart: period.start,
      currentPeriodEnd: period.end,
      lastPaymentError: null,
      graceUntil: stillCovered ? existing?.graceUntil ?? null : null,
    });
    return;
  }

  if (event.type === "subscription.resumed") {
    await upsertPaidSubscription(userId, existing, {
      ...base,
      plan: paidPlan,
      status: "ACTIVE",
      cancelAtPeriodEnd: false,
      cancelledAt: null,
      currentPeriodStart: period.start,
      currentPeriodEnd: period.end,
      lastPaymentError: null,
      graceUntil: null,
    });
    return;
  }

  await upsertPaidSubscription(userId, existing, {
    ...base,
    plan: paidPlan,
    status: "ACTIVE",
    cancelAtPeriodEnd: Boolean(event.cancelAtPeriodEnd),
    cancelledAt: event.cancelAtPeriodEnd ? existing?.cancelledAt ?? new Date() : null,
    currentPeriodStart: period.start,
    currentPeriodEnd: period.end,
    lastPaymentError: null,
    graceUntil: null,
  });
}

function isCheckoutPlan(plan?: Plan | null): plan is CheckoutPlan {
  return plan === "PRO_MONTHLY" || plan === "PRO_YEARLY";
}

async function planFromEvent(event: NormalizedBillingEvent): Promise<CheckoutPlan | null> {
  if (event.plan === "PRO_MONTHLY" || event.plan === "PRO_YEARLY") return event.plan;
  if (event.checkoutSessionId) {
    const session = await prisma.billingCheckoutSession.findUnique({
      where: { providerSessionId: event.checkoutSessionId },
    });
    if (session && isCheckoutPlan(session.plan)) return session.plan;
  }
  return null;
}

async function upsertPaidSubscription(
  userId: string,
  existing: Subscription | null,
  data: Prisma.SubscriptionUncheckedUpdateInput & {
    plan: Plan;
    status: Subscription["status"];
  }
) {
  if (existing) {
    await prisma.subscription.update({
      where: { id: existing.id },
      data,
    });
    return;
  }
  await prisma.subscription.create({
    data: {
      userId,
      plan: data.plan,
      status: data.status,
      cancelAtPeriodEnd: Boolean(data.cancelAtPeriodEnd),
      cancelledAt: (data.cancelledAt as Date | null) ?? null,
      currentPeriodStart: (data.currentPeriodStart as Date | null) ?? null,
      currentPeriodEnd: (data.currentPeriodEnd as Date | null) ?? null,
      provider: (data.provider as BillingProviderName) ?? "NONE",
      providerCustomerId: (data.providerCustomerId as string | null) ?? null,
      providerSubscriptionId:
        (data.providerSubscriptionId as string | null) ?? null,
      lastPaymentError: (data.lastPaymentError as string | null) ?? null,
      lastProviderEventAt: (data.lastProviderEventAt as Date | null) ?? null,
      lastProviderEventId: (data.lastProviderEventId as string | null) ?? null,
      graceUntil: (data.graceUntil as Date | null) ?? null,
    },
  });
}
