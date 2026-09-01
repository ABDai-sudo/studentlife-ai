import { getCurrentUser } from "@/lib/auth";
import { fail, ok, serverError, unauthorized } from "@/lib/api";
import { assignmentHelperSchema } from "@/lib/validations/ai-tools";
import {
  generateAssignmentDraft,
  listAssignmentDrafts,
  updateAssignmentDraftOutput,
} from "@/services/assignment-helper.service";
import { getRequestContext, isAllowedOrigin } from "@/lib/security/request";
import { rateLimit } from "@/lib/security/rate-limit";
import { z } from "zod";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    return ok(await listAssignmentDrafts(user.id));
  } catch {
    return serverError("Could not load drafts.");
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
    const rl = rateLimit(`ai:assign:${user.id}`, { limit: 20, windowSec: 3600 });
    if (!rl.allowed) {
      return fail("Too many requests. Try again later.", {
        code: "RATE_LIMITED",
        status: 429,
      });
    }
    const body = await request.json().catch(() => null);
    const parsed = assignmentHelperSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Validation failed", {
        code: "VALIDATION_ERROR",
        status: 422,
        details: parsed.error.flatten(),
      });
    }
    const result = await generateAssignmentDraft(user.id, parsed.data);
    return ok(result);
  } catch {
    return serverError("Assignment helper failed.");
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
    const parsed = z
      .object({
        id: z.string().cuid(),
        output: z.string().min(1).max(50000),
      })
      .safeParse(body);
    if (!parsed.success) {
      return fail("Validation failed", {
        code: "VALIDATION_ERROR",
        status: 422,
      });
    }
    const row = await updateAssignmentDraftOutput(
      user.id,
      parsed.data.id,
      parsed.data.output
    );
    return ok(row);
  } catch (error) {
    if (String(error).includes("NOT_FOUND")) {
      return fail("Not found", { code: "NOT_FOUND", status: 404 });
    }
    return serverError("Could not update draft.");
  }
}
