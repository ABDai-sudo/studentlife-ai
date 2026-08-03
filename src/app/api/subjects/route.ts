import { getCurrentUser } from "@/lib/auth";
import {
  created,
  fail,
  notFound,
  ok,
  serverError,
  unauthorized,
} from "@/lib/api";
import { createSubjectSchema } from "@/lib/validations/academics";
import {
  createSubject,
  deleteSubject,
  listSubjects,
} from "@/services/academics.service";
import { getRequestContext, isAllowedOrigin } from "@/lib/security/request";
import { safeLog } from "@/lib/security/safe-log";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const subjects = await listSubjects(user.id);
    return ok({ subjects });
  } catch (error) {
    safeLog("error", "List subjects failed", { error: String(error) });
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
    const body = await request.json().catch(() => null);
    const parsed = createSubjectSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Validation failed", {
        code: "VALIDATION_ERROR",
        status: 422,
        details: parsed.error.flatten(),
      });
    }
    const subject = await createSubject(user.id, parsed.data);
    return created({ subject });
  } catch (error) {
    safeLog("error", "Create subject failed", { error: String(error) });
    return serverError();
  }
}

export async function DELETE(request: Request) {
  try {
    const ctx = await getRequestContext();
    if (!isAllowedOrigin(ctx.origin)) {
      return fail("Invalid origin", { code: "FORBIDDEN", status: 403 });
    }
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return fail("Missing id", { status: 422 });
    const deleted = await deleteSubject(user.id, id);
    if (!deleted) return notFound("Subject not found");
    return ok({ deleted: true });
  } catch (error) {
    safeLog("error", "Delete subject failed", { error: String(error) });
    return serverError();
  }
}
