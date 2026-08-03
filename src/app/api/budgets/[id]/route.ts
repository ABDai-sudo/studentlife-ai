import { getCurrentUser } from "@/lib/auth";
import {
  fail,
  notFound,
  ok,
  serverError,
  unauthorized,
} from "@/lib/api";
import { deleteBudgetForUser } from "@/services/budget.service";
import { getRequestContext, isAllowedOrigin } from "@/lib/security/request";
import { safeLog } from "@/lib/security/safe-log";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: Ctx) {
  try {
    const reqCtx = await getRequestContext();
    if (!isAllowedOrigin(reqCtx.origin)) {
      return fail("Invalid origin", { code: "FORBIDDEN", status: 403 });
    }
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await context.params;
    const deleted = await deleteBudgetForUser(user.id, id);
    if (!deleted) return notFound("Budget not found");
    return ok({ deleted: true });
  } catch (error) {
    safeLog("error", "Delete budget failed", { error: String(error) });
    return serverError();
  }
}
