import { getCurrentUser } from "@/lib/auth";
import {
  fail,
  notFound,
  ok,
  serverError,
  unauthorized,
} from "@/lib/api";
import {
  contributeGoalSchema,
  updateGoalSchema,
} from "@/lib/validations/finance";
import {
  contributeToGoalForUser,
  deleteGoalForUser,
  updateGoalForUser,
} from "@/services/goal.service";
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

    const body = await request.json().catch(() => null);
    const parsed = updateGoalSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Validation failed", {
        code: "VALIDATION_ERROR",
        status: 422,
        details: parsed.error.flatten(),
      });
    }

    const goal = await updateGoalForUser(user.id, id, parsed.data);
    if (!goal) return notFound("Goal not found");
    return ok({ goal });
  } catch (error) {
    safeLog("error", "Update goal failed", { error: String(error) });
    return serverError();
  }
}

export async function DELETE(_request: Request, context: Ctx) {
  try {
    const reqCtx = await getRequestContext();
    if (!isAllowedOrigin(reqCtx.origin)) {
      return fail("Invalid origin", { code: "FORBIDDEN", status: 403 });
    }
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await context.params;
    const deleted = await deleteGoalForUser(user.id, id);
    if (!deleted) return notFound("Goal not found");
    return ok({ deleted: true });
  } catch (error) {
    safeLog("error", "Delete goal failed", { error: String(error) });
    return serverError();
  }
}

export async function POST(request: Request, context: Ctx) {
  try {
    const reqCtx = await getRequestContext();
    if (!isAllowedOrigin(reqCtx.origin)) {
      return fail("Invalid origin", { code: "FORBIDDEN", status: 403 });
    }
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await context.params;

    const body = await request.json().catch(() => null);
    const parsed = contributeGoalSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Validation failed", {
        code: "VALIDATION_ERROR",
        status: 422,
        details: parsed.error.flatten(),
      });
    }

    const goal = await contributeToGoalForUser(user.id, id, parsed.data);
    if (!goal) return notFound("Goal not found");
    return ok({ goal });
  } catch (error) {
    safeLog("error", "Contribute goal failed", { error: String(error) });
    return serverError();
  }
}
