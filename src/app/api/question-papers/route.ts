import { getCurrentUser } from "@/lib/auth";
import { fail, ok, serverError, unauthorized } from "@/lib/api";
import { questionPaperSchema } from "@/lib/validations/ai-tools";
import {
  generateQuestionPaper,
  listQuestionPapers,
} from "@/services/question-paper.service";
import { getRequestContext, isAllowedOrigin } from "@/lib/security/request";
import { rateLimit } from "@/lib/security/rate-limit";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    return ok(await listQuestionPapers(user.id));
  } catch {
    return serverError("Could not load papers.");
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
    const rl = rateLimit(`ai:paper:${user.id}`, { limit: 15, windowSec: 3600 });
    if (!rl.allowed) {
      return fail("Too many requests. Try again later.", {
        code: "RATE_LIMITED",
        status: 429,
      });
    }
    const body = await request.json().catch(() => null);
    const parsed = questionPaperSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Validation failed", {
        code: "VALIDATION_ERROR",
        status: 422,
        details: parsed.error.flatten(),
      });
    }
    const result = await generateQuestionPaper(user.id, parsed.data);
    return ok(result);
  } catch {
    return serverError("Question generator failed.");
  }
}
