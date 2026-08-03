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
  createAttendanceSchema,
  createCgpaSchema,
} from "@/lib/validations/academics";
import {
  createCgpa,
  deleteCgpa,
  getAcademicProgress,
  listAttendance,
  listCgpa,
  upsertAttendance,
} from "@/services/academics.service";
import { getRequestContext, isAllowedOrigin } from "@/lib/security/request";
import { safeLog } from "@/lib/security/safe-log";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const [progress, attendance, cgpa] = await Promise.all([
      getAcademicProgress(user.id),
      listAttendance(user.id),
      listCgpa(user.id),
    ]);
    return ok({ progress, attendance, cgpa });
  } catch (error) {
    safeLog("error", "Progress failed", { error: String(error) });
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
    const kind = body?.kind as string | undefined;

    if (kind === "attendance") {
      const parsed = createAttendanceSchema.safeParse(body);
      if (!parsed.success) {
        return fail("Validation failed", {
          code: "VALIDATION_ERROR",
          status: 422,
          details: parsed.error.flatten(),
        });
      }
      const record = await upsertAttendance(user.id, parsed.data);
      return created({ record });
    }

    if (kind === "cgpa") {
      const parsed = createCgpaSchema.safeParse(body);
      if (!parsed.success) {
        return fail("Validation failed", {
          code: "VALIDATION_ERROR",
          status: 422,
          details: parsed.error.flatten(),
        });
      }
      const record = await createCgpa(user.id, parsed.data);
      return created({ record });
    }

    return fail("Unknown kind", { status: 422 });
  } catch (error) {
    safeLog("error", "Progress write failed", { error: String(error) });
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
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const kind = url.searchParams.get("kind");
    if (!id || kind !== "cgpa") return fail("Missing id/kind", { status: 422 });
    const deleted = await deleteCgpa(user.id, id);
    if (!deleted) return notFound("Record not found");
    return ok({ deleted: true });
  } catch (error) {
    safeLog("error", "Progress delete failed", { error: String(error) });
    return serverError();
  }
}
