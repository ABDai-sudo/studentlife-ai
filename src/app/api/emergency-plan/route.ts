import { getCurrentUser } from "@/lib/auth";
import { fail, ok, serverError, unauthorized } from "@/lib/api";
import { emergencyPlanSchema } from "@/lib/validations/ai-tools";
import { buildEmergencyPlan } from "@/services/emergency-plan.service";
import { awardXp, recordMeaningfulActivity } from "@/services/gamification.service";
import { getRequestContext, isAllowedOrigin } from "@/lib/security/request";
import { rateLimit } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  try {
    const ctx = await getRequestContext();
    if (!isAllowedOrigin(ctx.origin)) {
      return fail("Invalid origin", { code: "FORBIDDEN", status: 403 });
    }
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const rl = rateLimit(`ai:emergency:${user.id}`, {
      limit: 20,
      windowSec: 3600,
    });
    if (!rl.allowed) {
      return fail("Too many requests. Try again later.", {
        code: "RATE_LIMITED",
        status: 429,
      });
    }
    const body = await request.json().catch(() => ({}));
    const parsed = emergencyPlanSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Validation failed", {
        code: "VALIDATION_ERROR",
        status: 422,
        details: parsed.error.flatten(),
      });
    }
    const plan = await buildEmergencyPlan(user.id, parsed.data);
    await awardXp(user.id, 20, "emergency_plan", "emergency_plan");
    await recordMeaningfulActivity(user.id, "study");
    return ok(plan);
  } catch {
    return serverError("Could not build emergency plan.");
  }
}
