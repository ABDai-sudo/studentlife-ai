import { getCurrentUser } from "@/lib/auth";
import { fail, ok, serverError, unauthorized } from "@/lib/api";
import { aiCoachSchema } from "@/lib/validations/finance";
import { askMoneyCoach } from "@/services/ai-coach.service";
import { getRequestContext, isAllowedOrigin } from "@/lib/security/request";
import { rateLimit } from "@/lib/security/rate-limit";
import { safeLog } from "@/lib/security/safe-log";
import { trackAnalyticsEvent } from "@/services/analytics.service";

export async function POST(request: Request) {
  try {
    const ctx = await getRequestContext();
    if (!isAllowedOrigin(ctx.origin)) {
      return fail("Invalid origin", { code: "FORBIDDEN", status: 403 });
    }
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const rl = rateLimit(`ai:coach:${user.id}`, { limit: 30, windowSec: 3600 });
    if (!rl.allowed) {
      return fail("Too many coach requests. Try again later.", {
        code: "RATE_LIMITED",
        status: 429,
      });
    }

    const body = await request.json().catch(() => null);
    const parsed = aiCoachSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Validation failed", {
        code: "VALIDATION_ERROR",
        status: 422,
        details: parsed.error.flatten(),
      });
    }

    const result = await askMoneyCoach(user.id, parsed.data.message);
    void trackAnalyticsEvent(
      { eventName: "ai_prompt_submitted", metadata: { provider: result.provider } },
      user.id
    );
    return ok(result);
  } catch (error) {
    safeLog("error", "AI coach failed", { error: String(error) });
    return serverError("Coach is temporarily unavailable.");
  }
}
