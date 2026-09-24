import { getCurrentUser } from "@/lib/auth";
import { fail, ok, unauthorized, serverError } from "@/lib/api";
import {
  BillingConfigRequiredError,
  type CheckoutPlan,
} from "@/lib/billing/provider";
import {
  getBillingSnapshot,
  requestCancel,
  requestResume,
  startCheckout,
} from "@/services/billing.service";
import { getRequestContext, isAllowedOrigin } from "@/lib/security/request";
import { rateLimit } from "@/lib/security/rate-limit";
import { AppUrlConfigError, resolveAppBaseUrl } from "@/lib/app-url";
import { z } from "zod";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    return ok(await getBillingSnapshot(user.id));
  } catch {
    return serverError("Could not load billing.");
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getRequestContext();
    if (!isAllowedOrigin(ctx.origin)) {
      return fail("Invalid origin", { code: "FORBIDDEN", status: 403 });
    }
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const rl = rateLimit(`billing:checkout:${user.id}`, {
      limit: 10,
      windowSec: 3600,
    });
    if (!rl.allowed) {
      return fail("Too many requests. Try again later.", {
        code: "RATE_LIMITED",
        status: 429,
      });
    }

    const body = await request.json().catch(() => null);
    const parsed = z
      .object({
        action: z.enum(["checkout", "cancel", "resume"]).default("checkout"),
        plan: z.enum(["PRO_MONTHLY", "PRO_YEARLY"]).optional(),
      })
      .safeParse(body);
    if (!parsed.success) {
      return fail("Validation failed", { code: "VALIDATION_ERROR", status: 422 });
    }

    if (parsed.data.action === "cancel") {
      await requestCancel(user.id);
      return ok({ cancelled: true });
    }
    if (parsed.data.action === "resume") {
      await requestResume(user.id);
      return ok({ resumed: true });
    }

    const plan = (parsed.data.plan || "PRO_MONTHLY") as CheckoutPlan;
    const origin = ctx.origin || resolveAppBaseUrl();
    const checkout = await startCheckout({
      userId: user.id,
      email: user.email,
      plan,
      successUrl: `${origin}/settings?billing=success`,
      cancelUrl: `${origin}/settings?billing=cancelled`,
    });
    return ok({
      checkoutUrl: checkout.checkoutUrl,
      sessionId: checkout.providerSessionId,
    });
  } catch (error) {
    if (error instanceof AppUrlConfigError) {
      return fail(error.message, { code: error.code, status: 503 });
    }
    if (error instanceof BillingConfigRequiredError) {
      return fail("PAYMENT_PROVIDER_CONFIG_REQUIRED", {
        code: "PAYMENT_PROVIDER_CONFIG_REQUIRED",
        status: 503,
      });
    }
    if (String(error).includes("NO_PROVIDER_SUBSCRIPTION")) {
      return fail("No provider subscription to update.", {
        code: "NOT_FOUND",
        status: 404,
      });
    }
    return serverError("Could not start billing action.");
  }
}
