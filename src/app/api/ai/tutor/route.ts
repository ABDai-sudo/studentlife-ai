import { getCurrentUser } from "@/lib/auth";
import { fail, ok, serverError, unauthorized } from "@/lib/api";
import { aiTutorSchema } from "@/lib/validations/academics";
import { askStudyTutor } from "@/services/ai-tutor.service";
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

    const rl = rateLimit(`ai:tutor:${user.id}`, { limit: 40, windowSec: 3600 });
    if (!rl.allowed) {
      return fail("Too many requests. Try again later.", {
        code: "RATE_LIMITED",
        status: 429,
      });
    }

    const body = await request.json().catch(() => null);
    const parsed = aiTutorSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Validation failed", {
        code: "VALIDATION_ERROR",
        status: 422,
        details: parsed.error.flatten(),
      });
    }

    const result = await askStudyTutor(
      user.id,
      parsed.data.message,
      parsed.data.subject
    );
    void trackAnalyticsEvent({ eventName: "ai_tutor_opened" }, user.id);
    return ok(result);
  } catch (error) {
    safeLog("error", "AI tutor failed", { error: String(error) });
    return serverError("Tutor is temporarily unavailable.");
  }
}
