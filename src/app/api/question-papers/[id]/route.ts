import { getCurrentUser } from "@/lib/auth";
import { fail, ok, serverError, unauthorized } from "@/lib/api";
import {
  deleteQuestionPaper,
  duplicateQuestionPaper,
  getQuestionPaper,
} from "@/services/question-paper.service";
import { getRequestContext, isAllowedOrigin } from "@/lib/security/request";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;
    const paper = await getQuestionPaper(user.id, id);
    if (!paper) return fail("Not found", { code: "NOT_FOUND", status: 404 });
    return ok(paper);
  } catch {
    return serverError("Could not load paper.");
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await getRequestContext();
    if (!isAllowedOrigin(ctx.origin)) {
      return fail("Invalid origin", { code: "FORBIDDEN", status: 403 });
    }
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const action = z.object({ action: z.literal("duplicate") }).safeParse(body);
    if (!action.success) {
      return fail("Unsupported action", { code: "VALIDATION_ERROR", status: 422 });
    }
    const paper = await duplicateQuestionPaper(user.id, id);
    return ok(paper);
  } catch (error) {
    if (String(error).includes("NOT_FOUND")) {
      return fail("Not found", { code: "NOT_FOUND", status: 404 });
    }
    return serverError("Could not duplicate paper.");
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
    const { id } = await params;
    await deleteQuestionPaper(user.id, id);
    return ok({ deleted: true });
  } catch (error) {
    if (String(error).includes("NOT_FOUND")) {
      return fail("Not found", { code: "NOT_FOUND", status: 404 });
    }
    return serverError("Could not delete paper.");
  }
}
