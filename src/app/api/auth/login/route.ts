import { loginSchema } from "@/lib/validations/auth";
import { loginUser, AuthError } from "@/services/auth.service";
import { ok, fail, serverError } from "@/lib/api";
import { rateLimit } from "@/lib/security/rate-limit";
import { getRequestContext } from "@/lib/security/request";
import { recordSecurityEvent } from "@/services/audit.service";
import { safeLog } from "@/lib/security/safe-log";
import { withDbRetry } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const ctx = await getRequestContext();

    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Validation failed", {
        code: "VALIDATION_ERROR",
        status: 422,
        details: parsed.error.flatten(),
      });
    }

    const emailKey = parsed.data.email.toLowerCase();
    const byIp = rateLimit(`login:ip:${ctx.ipHash}`, {
      limit: Number(process.env.RATE_LIMIT_LOGIN_IP || 20),
      windowSec: 900,
    });
    const byAccount = rateLimit(`login:acct:${emailKey}`, {
      limit: Number(process.env.RATE_LIMIT_LOGIN_ACCOUNT || 10),
      windowSec: 900,
    });

    if (!byIp.allowed || !byAccount.allowed) {
      void recordSecurityEvent({
        type: "rate_limited",
        severity: "MEDIUM",
        ipHash: ctx.ipHash,
        route: "/api/auth/login",
        messageSafe: "Login rate limited",
      });
      return fail("Too many requests. Try again later.", {
        code: "RATE_LIMITED",
        status: 429,
      });
    }

    const user = await withDbRetry(() =>
      loginUser(parsed.data, {
        ipHash: ctx.ipHash,
        userAgentCat: ctx.userAgentCat,
      })
    );

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
    if (error instanceof AuthError) {
      return fail(error.message, { code: error.code, status: 401 });
    }
    const message = error instanceof Error ? error.message : String(error);
    safeLog("error", "Login failed", {
      route: "/api/auth/login",
      error: message.slice(0, 200),
    });
    return serverError();
  }
}
