import type {
  BillingProvider,
  CheckoutPlan,
  NormalizedBillingEvent,
} from "./provider";
import { BillingConfigRequiredError } from "./provider";
import { verifyStripeSignature } from "./webhook-signature";

function priceId(plan: CheckoutPlan): string {
  const id =
    plan === "PRO_YEARLY"
      ? process.env.STRIPE_PRICE_PRO_YEARLY
      : process.env.STRIPE_PRICE_PRO_MONTHLY;
  if (!id?.trim()) throw new BillingConfigRequiredError();
  return id.trim();
}

async function stripeForm(
  path: string,
  body: Record<string, string>
): Promise<Record<string, unknown>> {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new BillingConfigRequiredError();
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body),
  });
  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(
      typeof json.error === "object" && json.error && "message" in json.error
        ? String((json.error as { message: string }).message)
        : "STRIPE_REQUEST_FAILED"
    );
  }
  return json;
}

function planFromPrice(price: string | undefined): CheckoutPlan | null {
  if (!price) return null;
  if (price === process.env.STRIPE_PRICE_PRO_YEARLY?.trim()) return "PRO_YEARLY";
  if (price === process.env.STRIPE_PRICE_PRO_MONTHLY?.trim()) return "PRO_MONTHLY";
  return null;
}

function unixToDate(value: unknown): Date | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return new Date(value * 1000);
}

function subscriptionPeriod(
  obj: Record<string, unknown>,
  items: { data?: Array<Record<string, unknown>> } | undefined,
  key: "current_period_start" | "current_period_end"
): Date | null {
  return unixToDate(obj[key]) ?? unixToDate(items?.data?.[0]?.[key]);
}

export const stripeBillingProvider: BillingProvider = {
  kind: "stripe",

  async createCheckout(input) {
    const session = await stripeForm("checkout/sessions", {
      mode: "subscription",
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      customer_email: input.email,
      client_reference_id: input.userId,
      "line_items[0][price]": priceId(input.plan),
      "line_items[0][quantity]": "1",
      "metadata[userId]": input.userId,
      "metadata[plan]": input.plan,
      "subscription_data[metadata][userId]": input.userId,
      "subscription_data[metadata][plan]": input.plan,
    });
    const id = String(session.id || "");
    const url = String(session.url || "");
    if (!id || !url) throw new Error("STRIPE_CHECKOUT_INCOMPLETE");
    return {
      providerSessionId: id,
      checkoutUrl: url,
      expiresAt: unixToDate(session.expires_at),
    };
  },

  async cancelSubscription(providerSubscriptionId) {
    await stripeForm(`subscriptions/${providerSubscriptionId}`, {
      cancel_at_period_end: "true",
    });
  },

  async resumeSubscription(providerSubscriptionId) {
    await stripeForm(`subscriptions/${providerSubscriptionId}`, {
      cancel_at_period_end: "false",
    });
  },

  async verifyWebhook(rawBody, headers) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
    if (!secret) throw new BillingConfigRequiredError();
    const check = verifyStripeSignature(
      rawBody,
      headers.get("stripe-signature"),
      secret
    );
    if (!check.ok) throw new Error(`WEBHOOK_SIGNATURE_${check.reason.toUpperCase()}`);
    const event = JSON.parse(rawBody) as {
      id: string;
      type: string;
      created: number;
      data?: { object?: Record<string, unknown> };
    };
    const obj = event.data?.object ?? {};
    const normalized = mapStripeEvent(event.id, event.type, event.created, obj);
    return normalized ? [normalized] : [];
  },
};

function mapStripeEvent(
  id: string,
  type: string,
  created: number,
  obj: Record<string, unknown>
): NormalizedBillingEvent | null {
  const meta = (obj.metadata as Record<string, string> | undefined) ?? {};
  const eventCreatedAt = new Date(created * 1000);
  const items = obj.items as
    | { data?: Array<{ price?: { id?: string }; current_period_end?: number; current_period_start?: number }> }
    | undefined;
  const price = items?.data?.[0]?.price?.id;
  const plan = planFromPrice(price) || (meta.plan as CheckoutPlan | undefined) || null;
  const periodStart = subscriptionPeriod(obj, items as { data?: Array<Record<string, unknown>> }, "current_period_start");
  const periodEnd = subscriptionPeriod(obj, items as { data?: Array<Record<string, unknown>> }, "current_period_end");

  if (type === "checkout.session.completed") {
    return {
      providerEventId: id,
      type: "checkout.completed",
      eventCreatedAt,
      userId: String(obj.client_reference_id || meta.userId || "") || null,
      checkoutSessionId: String(obj.id || ""),
      customerId: obj.customer ? String(obj.customer) : null,
      subscriptionId: obj.subscription ? String(obj.subscription) : null,
      plan: (obj.metadata as { plan?: CheckoutPlan } | undefined)?.plan || plan,
      payload: obj,
    };
  }
  if (type === "customer.subscription.created") {
    return {
      providerEventId: id,
      type: "subscription.created",
      eventCreatedAt,
      userId: meta.userId || null,
      customerId: obj.customer ? String(obj.customer) : null,
      subscriptionId: String(obj.id || ""),
      plan,
      status: String(obj.status || ""),
      periodStart,
      periodEnd,
      cancelAtPeriodEnd: Boolean(obj.cancel_at_period_end),
      payload: obj,
    };
  }
  if (type === "customer.subscription.updated") {
    const stripeStatus = String(obj.status || "").toLowerCase();
    const resumed = obj.cancel_at_period_end === false && stripeStatus === "active";
    let mapped: NormalizedBillingEvent["type"] = resumed
      ? "subscription.resumed"
      : "subscription.updated";
    if (stripeStatus === "past_due") mapped = "payment.failed";
    else if (stripeStatus === "unpaid") mapped = "payment.unpaid";
    else if (stripeStatus === "incomplete_expired") mapped = "subscription.expired";
    else if (stripeStatus === "canceled" || stripeStatus === "cancelled") {
      mapped = "subscription.cancelled";
    }
    return {
      providerEventId: id,
      type: mapped,
      eventCreatedAt,
      userId: meta.userId || null,
      customerId: obj.customer ? String(obj.customer) : null,
      subscriptionId: String(obj.id || ""),
      plan,
      status: String(obj.status || ""),
      periodStart,
      periodEnd,
      cancelAtPeriodEnd: Boolean(obj.cancel_at_period_end),
      paymentError: mapped === "payment.failed" ? "subscription_past_due" : null,
      payload: obj,
    };
  }
  if (type === "customer.subscription.deleted") {
    return {
      providerEventId: id,
      type: "subscription.cancelled",
      eventCreatedAt,
      userId: meta.userId || null,
      customerId: obj.customer ? String(obj.customer) : null,
      subscriptionId: String(obj.id || ""),
      plan,
      periodEnd,
      payload: obj,
    };
  }
  if (type === "invoice.payment_failed") {
    return {
      providerEventId: id,
      type: "payment.failed",
      eventCreatedAt,
      customerId: obj.customer ? String(obj.customer) : null,
      subscriptionId: obj.subscription ? String(obj.subscription) : null,
      paymentError: "invoice_payment_failed",
      payload: obj,
    };
  }
  if (type === "invoice.paid") {
    return {
      providerEventId: id,
      type: "subscription.renewed",
      eventCreatedAt,
      customerId: obj.customer ? String(obj.customer) : null,
      subscriptionId: obj.subscription ? String(obj.subscription) : null,
      periodStart: unixToDate(obj.period_start),
      periodEnd: unixToDate(obj.period_end),
      payload: obj,
    };
  }
  if (type === "invoice.marked_uncollectible") {
    return {
      providerEventId: id,
      type: "payment.unpaid",
      eventCreatedAt,
      customerId: obj.customer ? String(obj.customer) : null,
      subscriptionId: obj.subscription ? String(obj.subscription) : null,
      paymentError: "invoice_uncollectible",
      payload: obj,
    };
  }
  return null;
}
