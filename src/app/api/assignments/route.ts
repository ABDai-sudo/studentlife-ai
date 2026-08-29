import { getCurrentUser } from "@/lib/auth";
import {
  created,
  fail,
  notFound,
  ok,
  serverError,
  unauthorized,
} from "@/lib/api";
import {
  createAssignmentSchema,
  updateAssignmentSchema,
} from "@/lib/validations/academics";
import {
  createAssignment,
  deleteAssignment,
  listAssignments,
  updateAssignment,
} from "@/services/academics.service";
import { incrementWeeklyChallenge } from "@/services/gamification.service";
import { getRequestContext, isAllowedOrigin } from "@/lib/security/request";
import { safeLog } from "@/lib/security/safe-log";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const assignments = await listAssignments(user.id);
    return ok({ assignments });
  } catch (error) {
    safeLog("error", "List assignments failed", { error: String(error) });
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
    const parsed = createAssignmentSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Validation failed", {
        code: "VALIDATION_ERROR",
        status: 422,
        details: parsed.error.flatten(),
      });
    }
    const assignment = await createAssignment(user.id, parsed.data);
    return created({ assignment });
  } catch (error) {
    safeLog("error", "Create assignment failed", { error: String(error) });
    return serverError();
  }
}

export async function PATCH(request: Request) {
  try {
    const ctx = await getRequestContext();
    if (!isAllowedOrigin(ctx.origin)) {
      return fail("Invalid origin", { code: "FORBIDDEN", status: 403 });
    }
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const body = await request.json().catch(() => null);
    const id = body?.id as string | undefined;
    if (!id) return fail("Missing id", { status: 422 });
    const rest = { ...(body as Record<string, unknown>) };
    delete rest.id;
    const parsed = updateAssignmentSchema.safeParse(rest);
    if (!parsed.success) {
      return fail("Validation failed", {
        code: "VALIDATION_ERROR",
        status: 422,
        details: parsed.error.flatten(),
      });
    }
    const assignment = await updateAssignment(user.id, id, parsed.data);
    if (!assignment) return notFound("Assignment not found");
    const becameDone =
      (parsed.data.status === "SUBMITTED" || parsed.data.status === "GRADED") &&
      assignment.priority === 1;
    if (becameDone) {
      await incrementWeeklyChallenge(user.id, "high_priority_tasks");
    }
    return ok({ assignment });
  } catch (error) {
    safeLog("error", "Update assignment failed", { error: String(error) });
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
    const deleted = await deleteAssignment(user.id, id);
    if (!deleted) return notFound("Assignment not found");
    return ok({ deleted: true });
  } catch (error) {
    safeLog("error", "Delete assignment failed", { error: String(error) });
    return serverError();
  }
}
