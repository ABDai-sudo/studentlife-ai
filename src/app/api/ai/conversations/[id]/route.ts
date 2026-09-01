import { getCurrentUser } from "@/lib/auth";
import { fail, ok, serverError, unauthorized } from "@/lib/api";
import { renameConversationSchema } from "@/lib/validations/ai-tools";
import {
  deleteConversation,
  getConversation,
  renameConversation,
} from "@/services/ai-conversation.service";
import { getRequestContext, isAllowedOrigin } from "@/lib/security/request";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;
    const row = await getConversation(user.id, id);
    if (!row) return fail("Not found", { code: "NOT_FOUND", status: 404 });
    return ok(row);
  } catch {
    return serverError("Could not load conversation.");
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const ctx = await getRequestContext();
    if (!isAllowedOrigin(ctx.origin)) {
      return fail("Invalid origin", { code: "FORBIDDEN", status: 403 });
    }
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const parsed = renameConversationSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Validation failed", {
        code: "VALIDATION_ERROR",
        status: 422,
      });
    }
    const row = await renameConversation(user.id, id, parsed.data.title);
    return ok(row);
  } catch (error) {
    if (String(error).includes("NOT_FOUND")) {
      return fail("Not found", { code: "NOT_FOUND", status: 404 });
    }
    return serverError("Could not rename conversation.");
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
    await deleteConversation(user.id, id);
    return ok({ deleted: true });
  } catch (error) {
    if (String(error).includes("NOT_FOUND")) {
      return fail("Not found", { code: "NOT_FOUND", status: 404 });
    }
    return serverError("Could not delete conversation.");
  }
}
