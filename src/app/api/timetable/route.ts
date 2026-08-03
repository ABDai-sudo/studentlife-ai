import { getCurrentUser } from "@/lib/auth";
import {
  created,
  fail,
  notFound,
  ok,
  serverError,
  unauthorized,
} from "@/lib/api";
import { createTimetableSchema } from "@/lib/validations/academics";
import {
  createTimetableSlot,
  deleteTimetableSlot,
  listTimetable,
} from "@/services/academics.service";
import { getRequestContext, isAllowedOrigin } from "@/lib/security/request";
import { safeLog } from "@/lib/security/safe-log";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const slots = await listTimetable(user.id);
    return ok({ slots });
  } catch (error) {
    safeLog("error", "List timetable failed", { error: String(error) });
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
    const parsed = createTimetableSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Validation failed", {
        code: "VALIDATION_ERROR",
        status: 422,
        details: parsed.error.flatten(),
      });
    }
    try {
      const slot = await createTimetableSlot(user.id, parsed.data);
      return created({ slot });
    } catch (e) {
      if (String(e).includes("SUBJECT_NOT_FOUND")) {
        return fail("Subject not found", { status: 404 });
      }
      throw e;
    }
  } catch (error) {
    safeLog("error", "Create timetable failed", { error: String(error) });
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
    const deleted = await deleteTimetableSlot(user.id, id);
    if (!deleted) return notFound("Slot not found");
    return ok({ deleted: true });
  } catch (error) {
    safeLog("error", "Delete timetable failed", { error: String(error) });
    return serverError();
  }
}
