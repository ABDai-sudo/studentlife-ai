import { getCurrentUser } from "@/lib/auth";
import { fail, ok, serverError, unauthorized } from "@/lib/api";
import {
  completeStudySession,
  listStudySessions,
  startStudySession,
} from "@/services/study-tools.service";
import { getRequestContext, isAllowedOrigin } from "@/lib/security/request";
import { z } from "zod";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    return ok(await listStudySessions(user.id));
  } catch {
    return serverError("Could not load sessions.");
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
    const parsed = z
      .object({
        subject: z.string().trim().max(100).optional(),
        taskTitle: z.string().trim().max(160).optional(),
        plannedMinutes: z.coerce.number().int().min(15).max(60),
      })
      .safeParse(body);
    if (!parsed.success) {
      return fail("Validation failed", {
        code: "VALIDATION_ERROR",
        status: 422,
      });
    }
    return ok(await startStudySession(user.id, parsed.data));
  } catch {
    return serverError("Could not start session.");
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
    const parsed = z.object({ id: z.string().cuid() }).safeParse(body);
    if (!parsed.success) {
      return fail("Validation failed", {
        code: "VALIDATION_ERROR",
        status: 422,
      });
    }
    return ok(await completeStudySession(user.id, parsed.data.id));
  } catch (error) {
    if (String(error).includes("NOT_FOUND")) {
      return fail("Not found", { code: "NOT_FOUND", status: 404 });
    }
    return serverError("Could not complete session.");
  }
}
