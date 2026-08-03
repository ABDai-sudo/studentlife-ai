import { getCurrentUser } from "@/lib/auth";
import {
  created,
  fail,
  notFound,
  ok,
  serverError,
  unauthorized,
} from "@/lib/api";
import { createNoteSchema } from "@/lib/validations/academics";
import { createNote, deleteNote, listNotes } from "@/services/academics.service";
import { getRequestContext, isAllowedOrigin } from "@/lib/security/request";
import { safeLog } from "@/lib/security/safe-log";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const notes = await listNotes(user.id);
    return ok({ notes });
  } catch (error) {
    safeLog("error", "List notes failed", { error: String(error) });
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
    const parsed = createNoteSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Validation failed", {
        code: "VALIDATION_ERROR",
        status: 422,
        details: parsed.error.flatten(),
      });
    }
    try {
      const note = await createNote(user.id, parsed.data);
      return created({ note });
    } catch (e) {
      if (String(e).includes("SUBJECT_NOT_FOUND")) {
        return fail("Subject not found", { status: 404 });
      }
      throw e;
    }
  } catch (error) {
    safeLog("error", "Create note failed", { error: String(error) });
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
    const deleted = await deleteNote(user.id, id);
    if (!deleted) return notFound("Note not found");
    return ok({ deleted: true });
  } catch (error) {
    safeLog("error", "Delete note failed", { error: String(error) });
    return serverError();
  }
}
