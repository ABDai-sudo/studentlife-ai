import { createHmac } from "crypto";
import type {
  BillingProvider,
  NormalizedBillingEvent,
} from "./provider";
import { BillingConfigRequiredError } from "./provider";
import { verifyDevWebhookSignature } from "./webhook-signature";

function baseUrl() {
  return (
    process.env.APP_BASE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

function periodFor(plan: "PRO_MONTHLY" | "PRO_YEARLY", from = new Date()) {
  const start = from;
  const end = new Date(from);
  if (plan === "PRO_YEARLY") end.setUTCFullYear(end.getUTCFullYear() + 1);
  else end.setUTCMonth(end.getUTCMonth() + 1);
  return { start, end };
}

/** Test-only provider. Never used unless BILLING_PROVIDER=dev. */
export const devBillingProvider: BillingProvider = {
  kind: "dev",

  async createCheckout(input) {
    const providerSessionId = `dev_cs_${input.userId}_${Date.now()}`;
    const checkoutUrl = `${baseUrl()}/settings?billing=dev-checkout&session=${encodeURIComponent(providerSessionId)}&plan=${input.plan}`;
    return {
      providerSessionId,
      checkoutUrl,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    };
  },

  async cancelSubscription() {
    /* webhook/dev event applies state */
  },

  async resumeSubscription() {
    /* webhook/dev event applies state */
  },

  async verifyWebhook(rawBody, headers) {
    const secret = process.env.BILLING_DEV_WEBHOOK_SECRET?.trim();
    if (!secret) throw new BillingConfigRequiredError();
    if (
      !verifyDevWebhookSignature(
        rawBody,
        headers.get("x-dev-billing-signature"),
        secret
      )
    ) {
      throw new Error("WEBHOOK_SIGNATURE_BAD_SIGNATURE");
    }
    const parsed = JSON.parse(rawBody) as NormalizedBillingEvent;
    if (!parsed?.providerEventId || !parsed.type) {
      throw new Error("WEBHOOK_PAYLOAD_INVALID");
    }
    return [
      {
        ...parsed,
        eventCreatedAt: new Date(parsed.eventCreatedAt),
        periodStart: parsed.periodStart ? new Date(parsed.periodStart) : null,
        periodEnd: parsed.periodEnd ? new Date(parsed.periodEnd) : null,
      },
    ];
  },
};

export function signDevWebhook(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

export { periodFor };
