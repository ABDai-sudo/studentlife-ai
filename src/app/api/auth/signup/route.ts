import { signupSchema } from "@/lib/validations/auth";
import { signupUser, AuthError } from "@/services/auth.service";
import { created, fail, serverError } from "@/lib/api";
import { rateLimit } from "@/lib/security/rate-limit";
import { getRequestContext } from "@/lib/security/request";
import { safeLog } from "@/lib/security/safe-log";
import { trackAnalyticsEvent } from "@/services/analytics.service";

export async function POST(request: Request) {
  try {
    const ctx = await getRequestContext();

    void trackAnalyticsEvent({ eventName: "signup_started" });

    const body = await request.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Validation failed", {
        code: "VALIDATION_ERROR",
        status: 422,
        details: parsed.error.flatten(),
      });
    }

    const rl = rateLimit(`signup:ip:${ctx.ipHash}`, {
      limit: Number(process.env.RATE_LIMIT_SIGNUP_IP || 8),
      windowSec: 3600,
    });
    if (!rl.allowed) {
      return fail("Too many requests. Try again later.", {
        code: "RATE_LIMITED",
        status: 429,
      });
    }

    const user = await signupUser(parsed.data);
    return created({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        onboardingComplete: user.onboardingComplete,
        plan: user.plan,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return fail(error.message, {
        code: error.code,
        status: error.code === "EMAIL_TAKEN" ? 409 : 400,
      });
    }
    safeLog("error", "Signup failed", { route: "/api/auth/signup" });
    return serverError();
  }
}
