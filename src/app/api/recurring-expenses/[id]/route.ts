import { getCurrentUser } from "@/lib/auth";
import { fail, notFound, ok, serverError, unauthorized } from "@/lib/api";
import { updateRecurringExpenseSchema } from "@/lib/validations/recurring-expense";
import {
  deleteRecurringExpenseForUser,
  updateRecurringExpenseForUser,
} from "@/services/recurring-expense.service";
import { getRequestContext, isAllowedOrigin } from "@/lib/security/request";
import { safeLog } from "@/lib/security/safe-log";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Ctx) {
  try {
    const reqCtx = await getRequestContext();
    if (!isAllowedOrigin(reqCtx.origin)) {
      return fail("Invalid origin", { code: "FORBIDDEN", status: 403 });
    }
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await context.params;
    const parsed = updateRecurringExpenseSchema.safeParse(
      await request.json().catch(() => null)
    );
    if (!parsed.success) {
      return fail("Validation failed", {
        code: "VALIDATION_ERROR",
        status: 422,
        details: parsed.error.flatten(),
      });
    }
    const item = await updateRecurringExpenseForUser(user.id, id, parsed.data);
    if (!item) return notFound("Recurring expense not found");
    return ok({ item });
  } catch (error) {
    safeLog("error", "Update recurring expense failed", { error: String(error) });
    return serverError();
  }
}

export async function DELETE(request: Request, context: Ctx) {
  try {
    const reqCtx = await getRequestContext();
    if (!isAllowedOrigin(reqCtx.origin)) {
      return fail("Invalid origin", { code: "FORBIDDEN", status: 403 });
    }
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await context.params;
    const deleted = await deleteRecurringExpenseForUser(user.id, id);
    if (!deleted) return notFound("Recurring expense not found");
    return ok({ deleted: true });
  } catch (error) {
    safeLog("error", "Delete recurring expense failed", { error: String(error) });
    return serverError();
  }
}
