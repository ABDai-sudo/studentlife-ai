import { getCurrentUser } from "@/lib/auth";
import { fail, ok, unauthorized, serverError } from "@/lib/api";
import { resolveBillingProviderKind } from "@/lib/billing/provider";
import type { CheckoutPlan, NormalizedBillingEvent } from "@/lib/billing/provider";
import { periodFor } from "@/lib/billing/dev-provider";
import { applyBillingEvent } from "@/services/billing.service";
import { getRequestContext, isAllowedOrigin } from "@/lib/security/request";
import { prisma } from "@/lib/db";
import { z } from "zod";

/** Explicit test-only simulation. Never enabled for Stripe/production. */
export async function POST(request: Request) {
  try {
    if (process.env.NODE_ENV === "production" || resolveBillingProviderKind() !== "dev") {
      const status = process.env.NODE_ENV === "production" ? 404 : 403;
      return fail("Dev billing is not enabled.", { code: "FORBIDDEN", status });
    }
    const ctx = await getRequestContext();
    if (!isAllowedOrigin(ctx.origin)) {
      return fail("Invalid origin", { code: "FORBIDDEN", status: 403 });
    }
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const parsed = z
      .object({
        type: z.enum([
          "checkout.completed",
          "subscription.created",
          "subscription.renewed",
          "payment.failed",
          "payment.unpaid",
          "subscription.cancelled",
          "subscription.resumed",
          "subscription.expired",
        ]),
        plan: z.enum(["PRO_MONTHLY", "PRO_YEARLY"]).default("PRO_MONTHLY"),
        sessionId: z.string().min(4).max(120).optional(),
        eventId: z.string().min(4).max(120).optional(),
        eventCreatedAt: z.string().datetime().optional(),
      })
      .safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return fail("Validation failed", { code: "VALIDATION_ERROR", status: 422 });
    }

    const plan = parsed.data.plan as CheckoutPlan;
    const { start, end } = periodFor(plan);
    const sessionId =
      parsed.data.sessionId ||
      (
        await prisma.billingCheckoutSession.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
        })
      )?.providerSessionId ||
      `dev_cs_${user.id}`;

    const event: NormalizedBillingEvent = {
      providerEventId: parsed.data.eventId || `dev_evt_${crypto.randomUUID()}`,
      type: parsed.data.type,
      eventCreatedAt: parsed.data.eventCreatedAt
        ? new Date(parsed.data.eventCreatedAt)
        : new Date(),
      userId: user.id,
      checkoutSessionId: sessionId,
      customerId: `dev_cus_${user.id}`,
      subscriptionId: `dev_sub_${user.id}`,
      plan,
      periodStart: start,
      periodEnd: end,
      cancelAtPeriodEnd: parsed.data.type === "subscription.cancelled",
      paymentError:
        parsed.data.type === "payment.failed" || parsed.data.type === "payment.unpaid"
          ? "dev_payment_failed"
          : null,
      payload: { source: "dev-simulate", type: parsed.data.type },
    };

    const result = await applyBillingEvent("DEV", event);
    return ok(result);
  } catch {
    return serverError("Dev billing event failed.");
  }
}
