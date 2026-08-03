import { getCurrentUser } from "@/lib/auth";
import {
  created,
  fail,
  ok,
  serverError,
  unauthorized,
} from "@/lib/api";
import { upsertBudgetSchema } from "@/lib/validations/finance";
import {
  listBudgetsForUser,
  upsertBudgetForUser,
} from "@/services/budget.service";
import { getRequestContext, isAllowedOrigin } from "@/lib/security/request";
import { rateLimit } from "@/lib/security/rate-limit";
import { safeLog } from "@/lib/security/safe-log";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const budgets = await listBudgetsForUser(user.id);
    return ok({ budgets });
  } catch (error) {
    safeLog("error", "List budgets failed", { error: String(error) });
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

    const rl = rateLimit(`budgets:upsert:${user.id}`, {
      limit: 60,
      windowSec: 3600,
    });
    if (!rl.allowed) {
      return fail("Too many requests. Try again later.", {
        code: "RATE_LIMITED",
        status: 429,
      });
    }

    const body = await request.json().catch(() => null);
    const parsed = upsertBudgetSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Validation failed", {
        code: "VALIDATION_ERROR",
        status: 422,
        details: parsed.error.flatten(),
      });
    }

    const budget = await upsertBudgetForUser(user.id, parsed.data);
    return created({ budget });
  } catch (error) {
    safeLog("error", "Upsert budget failed", { error: String(error) });
    return serverError();
  }
}
