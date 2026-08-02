import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized, serverError } from "@/lib/api";
import { safeLog } from "@/lib/security/safe-log";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    return ok({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        onboardingComplete: user.onboardingComplete,
        plan: user.plan,
      },
    });
  } catch (error) {
    safeLog("error", "Me endpoint failed", { error: String(error) });
    return serverError();
  }
}
