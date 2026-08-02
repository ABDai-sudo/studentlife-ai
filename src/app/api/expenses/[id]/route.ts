import { getCurrentUser } from "@/lib/auth";
import {
  fail,
  notFound,
  ok,
  serverError,
  unauthorized,
} from "@/lib/api";
import { deleteExpenseForUser } from "@/services/expense.service";
import { safeLog } from "@/lib/security/safe-log";
import { getRequestContext, isAllowedOrigin } from "@/lib/security/request";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, context: Ctx) {
  try {
    const reqCtx = await getRequestContext();
    if (!isAllowedOrigin(reqCtx.origin)) {
      return fail("Invalid origin", { code: "FORBIDDEN", status: 403 });
    }

    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { id } = await context.params;
    if (!id) return fail("Missing expense id", { status: 400 });

    const deleted = await deleteExpenseForUser(user.id, id);
    if (!deleted) return notFound("Expense not found");

    return ok({ deleted: true });
  } catch (error) {
    safeLog("error", "Delete expense failed", { error: String(error) });
    return serverError("Could not delete expense.");
  }
}
