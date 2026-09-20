import { getCurrentUser } from "@/lib/auth";
import { created, fail, ok, serverError, unauthorized } from "@/lib/api";
import {
  createRecurringExpenseSchema,
} from "@/lib/validations/recurring-expense";
import {
  createRecurringExpenseForUser,
  listRecurringExpensesForUser,
} from "@/services/recurring-expense.service";
import { getRequestContext, isAllowedOrigin } from "@/lib/security/request";
import { safeLog } from "@/lib/security/safe-log";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const items = await listRecurringExpensesForUser(user.id);
    return ok({ items });
  } catch (error) {
    safeLog("error", "List recurring expenses failed", { error: String(error) });
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
    const parsed = createRecurringExpenseSchema.safeParse(
      await request.json().catch(() => null)
    );
    if (!parsed.success) {
      return fail("Validation failed", {
        code: "VALIDATION_ERROR",
        status: 422,
        details: parsed.error.flatten(),
      });
    }
    const item = await createRecurringExpenseForUser(user.id, parsed.data);
    return created({ item });
  } catch (error) {
    safeLog("error", "Create recurring expense failed", { error: String(error) });
    return serverError();
  }
}
