import { fail, ok, serverError } from "@/lib/api";
import { BillingConfigRequiredError } from "@/lib/billing/provider";
import { resolveBillingProviderKind } from "@/lib/billing/provider";
import { applyBillingEvent, getBillingProvider, providerEnum } from "@/services/billing.service";
import { safeLog } from "@/lib/security/safe-log";

export async function POST(request: Request) {
  try {
    const kind = resolveBillingProviderKind();
    if (kind === "none") {
      return fail("PAYMENT_PROVIDER_CONFIG_REQUIRED", {
        code: "PAYMENT_PROVIDER_CONFIG_REQUIRED",
        status: 503,
      });
    }
    const raw = await request.text();
    const provider = getBillingProvider();
    const events = await provider.verifyWebhook(raw, request.headers);
    const results = [];
    for (const event of events) {
      results.push(await applyBillingEvent(providerEnum(), event));
    }
    return ok({ received: true, results });
  } catch (error) {
    if (error instanceof BillingConfigRequiredError) {
      return fail("PAYMENT_PROVIDER_CONFIG_REQUIRED", {
        code: "PAYMENT_PROVIDER_CONFIG_REQUIRED",
        status: 503,
      });
    }
    const message = String(error);
    if (message.includes("WEBHOOK_SIGNATURE")) {
      return fail("Invalid webhook signature.", {
        code: "WEBHOOK_SIGNATURE_INVALID",
        status: 400,
      });
    }
    safeLog("error", "Billing webhook failed", { error: message });
    return serverError("Webhook processing failed.");
  }
}
