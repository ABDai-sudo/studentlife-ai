import { getCurrentUser } from "@/lib/auth";
import {
  created,
  fail,
  ok,
  serverError,
  unauthorized,
} from "@/lib/api";
import {
  createExpenseSchema,
  listExpensesSchema,
} from "@/lib/validations/expense";
import {
  createExpenseForUser,
  listExpensesForUser,
} from "@/services/expense.service";
import { safeLog } from "@/lib/security/safe-log";
import { isAllowedOrigin } from "@/lib/security/request";
import { rateLimit } from "@/lib/security/rate-limit";
import { getRequestContext } from "@/lib/security/request";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const url = new URL(request.url);
    const parsed = listExpensesSchema.safeParse(
      Object.fromEntries(url.searchParams)
    );
    if (!parsed.success) {
      return fail("Invalid query", {
        code: "VALIDATION_ERROR",
        status: 422,
        details: parsed.error.flatten(),
      });
    }

    const data = await listExpensesForUser(user.id, parsed.data);
    return ok(data);
  } catch (error) {
    safeLog("error", "List expenses failed", { error: String(error) });
    return serverError(
      "Expenses are temporarily unavailable. Check that the database is running."
    );
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

    const rl = rateLimit(`expenses:create:${user.id}`, {
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
    const parsed = createExpenseSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Validation failed", {
        code: "VALIDATION_ERROR",
        status: 422,
        details: parsed.error.flatten(),
      });
    }

    const expense = await createExpenseForUser(user.id, parsed.data);
    return created({ expense });
  } catch (error) {
    safeLog("error", "Create expense failed", { error: String(error) });
    return serverError(
      "Could not save expense. Check that the database is running."
    );
  }
}
