import { getCurrentUser } from "@/lib/auth";
import { fail, ok, serverError, unauthorized } from "@/lib/api";
import { updateQuestionSchema } from "@/lib/validations/ai-tools";
import {
  deleteGeneratedQuestion,
  updateGeneratedQuestion,
} from "@/services/question-paper.service";
import { getRequestContext, isAllowedOrigin } from "@/lib/security/request";

type Params = { params: Promise<{ id: string; qid: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const ctx = await getRequestContext();
    if (!isAllowedOrigin(ctx.origin)) {
      return fail("Invalid origin", { code: "FORBIDDEN", status: 403 });
    }
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id, qid } = await params;
    const body = await request.json().catch(() => null);
    const parsed = updateQuestionSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Validation failed", {
        code: "VALIDATION_ERROR",
        status: 422,
      });
    }
    const row = await updateGeneratedQuestion(user.id, id, qid, parsed.data);
    return ok(row);
  } catch (error) {
    if (String(error).includes("NOT_FOUND")) {
      return fail("Not found", { code: "NOT_FOUND", status: 404 });
    }
    return serverError("Could not update question.");
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const ctx = await getRequestContext();
    if (!isAllowedOrigin(ctx.origin)) {
      return fail("Invalid origin", { code: "FORBIDDEN", status: 403 });
    }
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id, qid } = await params;
    await deleteGeneratedQuestion(user.id, id, qid);
    return ok({ deleted: true });
  } catch (error) {
    if (String(error).includes("NOT_FOUND")) {
      return fail("Not found", { code: "NOT_FOUND", status: 404 });
    }
    return serverError("Could not delete question.");
  }
}
