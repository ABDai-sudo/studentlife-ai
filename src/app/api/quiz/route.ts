import { getCurrentUser } from "@/lib/auth";
import { fail, ok, serverError, unauthorized } from "@/lib/api";
import { createQuizAttempt } from "@/services/quiz.service";
import { getRequestContext, isAllowedOrigin } from "@/lib/security/request";
import { z } from "zod";

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
        title: z.string().trim().min(1).max(160).default("Quiz Rush"),
        score: z.coerce.number().int().min(0).max(100),
        maxScore: z.coerce.number().int().min(1).max(100),
        durationSec: z.coerce.number().int().min(1).max(7200).optional(),
      })
      .safeParse(body);

    if (!parsed.success) {
      return fail("Validation failed", {
        code: "VALIDATION_ERROR",
        status: 422,
      });
    }

    return ok(await createQuizAttempt(user.id, parsed.data));
  } catch {
    return serverError("Could not save quiz attempt.");
  }
}
