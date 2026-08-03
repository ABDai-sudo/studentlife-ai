import { getCurrentUser } from "@/lib/auth";
import {
  created,
  fail,
  ok,
  serverError,
  unauthorized,
} from "@/lib/api";
import { createGoalSchema } from "@/lib/validations/finance";
import {
  createGoalForUser,
  listGoalsForUser,
} from "@/services/goal.service";
import { getRequestContext, isAllowedOrigin } from "@/lib/security/request";
import { rateLimit } from "@/lib/security/rate-limit";
import { safeLog } from "@/lib/security/safe-log";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const goals = await listGoalsForUser(user.id);
    return ok({ goals });
  } catch (error) {
    safeLog("error", "List goals failed", { error: String(error) });
    return serverError();
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

    const rl = rateLimit(`goals:create:${user.id}`, { limit: 40, windowSec: 3600 });
    if (!rl.allowed) {
      return fail("Too many requests. Try again later.", {
        code: "RATE_LIMITED",
        status: 429,
      });
    }

    const body = await request.json().catch(() => null);
    const parsed = createGoalSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Validation failed", {
        code: "VALIDATION_ERROR",
        status: 422,
        details: parsed.error.flatten(),
      });
    }

    const goal = await createGoalForUser(user.id, parsed.data);
    return created({ goal });
  } catch (error) {
    safeLog("error", "Create goal failed", { error: String(error) });
    return serverError();
  }
}
