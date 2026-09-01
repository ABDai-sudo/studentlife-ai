import { getCurrentUser } from "@/lib/auth";
import { fail, ok, serverError, unauthorized } from "@/lib/api";
import { createConversationSchema } from "@/lib/validations/ai-tools";
import {
  createConversation,
  listConversations,
} from "@/services/ai-conversation.service";
import { getRequestContext, isAllowedOrigin } from "@/lib/security/request";
import { rateLimit } from "@/lib/security/rate-limit";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("q") || undefined;
    const rows = await listConversations(user.id, search);
    return ok(rows);
  } catch {
    return serverError("Could not load conversations.");
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
    const rl = rateLimit(`ai:convo:${user.id}`, { limit: 30, windowSec: 3600 });
    if (!rl.allowed) {
      return fail("Too many requests. Try again later.", {
        code: "RATE_LIMITED",
        status: 429,
      });
    }
    const body = await request.json().catch(() => ({}));
    const parsed = createConversationSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Validation failed", {
        code: "VALIDATION_ERROR",
        status: 422,
        details: parsed.error.flatten(),
      });
    }
    const row = await createConversation(
      user.id,
      parsed.data.title,
      parsed.data.subject
    );
    return ok(row);
  } catch {
    return serverError("Could not create conversation.");
  }
}
