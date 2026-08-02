import { ok, fail } from "@/lib/api";
import {
  analyticsEventSchema,
  trackAnalyticsEvent,
} from "@/services/analytics.service";
import { getSessionFromCookies } from "@/lib/auth/session";
import { rateLimit } from "@/lib/security/rate-limit";
import { getRequestContext } from "@/lib/security/request";

export async function POST(request: Request) {
  try {
    const ctx = await getRequestContext();
    const rl = rateLimit(`analytics:${ctx.ipHash}`, {
      limit: Number(process.env.RATE_LIMIT_ANALYTICS || 120),
      windowSec: 60,
    });
    if (!rl.allowed) {
      return fail("Too many requests", { code: "RATE_LIMITED", status: 429 });
    }
    const body = await request.json().catch(() => null);
    const parsed = analyticsEventSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Invalid analytics event", {
        code: "VALIDATION_ERROR",
        status: 422,
        details: { issues: parsed.error.issues.map((i) => i.message) },
      });
    }
    const session = await getSessionFromCookies();
    await trackAnalyticsEvent(parsed.data, session?.userId ?? null);
    return ok({ accepted: true });
  } catch {
    return ok({ accepted: false });
  }
}

export async function GET() {
  return fail("Method not allowed", { status: 405 });
}
