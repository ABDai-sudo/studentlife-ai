import { getCurrentUser } from "@/lib/auth";
import { fail, ok, serverError, unauthorized } from "@/lib/api";
import { onboardingSchema } from "@/lib/validations/auth";
import { updateProfileSchema } from "@/lib/validations/finance";
import {
  completeOnboardingForUser,
  getProfileForUser,
  updateProfileForUser,
} from "@/services/profile.service";
import { getRequestContext, isAllowedOrigin } from "@/lib/security/request";
import { rateLimit } from "@/lib/security/rate-limit";
import { safeLog } from "@/lib/security/safe-log";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const profile = await getProfileForUser(user.id);
    return ok({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        onboardingComplete: user.onboardingComplete,
      },
      profile,
    });
  } catch (error) {
    safeLog("error", "Get profile failed", { error: String(error) });
    return serverError();
  }
}

export async function PATCH(request: Request) {
  try {
    const ctx = await getRequestContext();
    if (!isAllowedOrigin(ctx.origin)) {
      return fail("Invalid origin", { code: "FORBIDDEN", status: 403 });
    }
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = await request.json().catch(() => null);
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Validation failed", {
        code: "VALIDATION_ERROR",
        status: 422,
        details: parsed.error.flatten(),
      });
    }

    const profile = await updateProfileForUser(user.id, parsed.data);
    return ok({ profile });
  } catch (error) {
    safeLog("error", "Update profile failed", { error: String(error) });
    return serverError();
  }
}

export async function POST(request: Request) {
  // Complete onboarding via POST /api/profile with action, or use /api/profile/onboarding
  try {
    const ctx = await getRequestContext();
    if (!isAllowedOrigin(ctx.origin)) {
      return fail("Invalid origin", { code: "FORBIDDEN", status: 403 });
    }
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const rl = rateLimit(`onboarding:${user.id}`, { limit: 20, windowSec: 3600 });
    if (!rl.allowed) {
      return fail("Too many requests. Try again later.", {
        code: "RATE_LIMITED",
        status: 429,
      });
    }

    const body = await request.json().catch(() => null);
    const parsed = onboardingSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Validation failed", {
        code: "VALIDATION_ERROR",
        status: 422,
        details: parsed.error.flatten(),
      });
    }

    const profile = await completeOnboardingForUser(user.id, parsed.data);
    return ok({ profile });
  } catch (error) {
    safeLog("error", "Onboarding failed", { error: String(error) });
    return serverError();
  }
}
