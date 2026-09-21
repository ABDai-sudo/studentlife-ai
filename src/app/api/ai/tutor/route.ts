import { getCurrentUser } from "@/lib/auth";
import { fail, ok, serverError, unauthorized } from "@/lib/api";
import { aiTutorSchema } from "@/lib/validations/ai-tools";
import { askStudyTutor, TutorProviderError } from "@/services/ai-tutor.service";
import { sanitizeTutorVisibleText } from "@/services/ai/visible-output";
import { getRequestContext, isAllowedOrigin } from "@/lib/security/request";
import { rateLimit } from "@/lib/security/rate-limit";
import { safeLog } from "@/lib/security/safe-log";
import { trackAnalyticsEvent } from "@/services/analytics.service";
import { aiRateLimit } from "@/services/billing.service";

export async function GET() {
  return ok({ ok: true, route: "ai-tutor" });
}

export async function POST(request: Request) {
  try {
    const ctx = await getRequestContext();
    if (!isAllowedOrigin(ctx.origin)) {
      return fail("Invalid origin", { code: "FORBIDDEN", status: 403 });
    }
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const rl = rateLimit(`ai:tutor:${user.id}`, await aiRateLimit(user.id, "tutor"));
    if (!rl.allowed) {
      return fail("Too many requests. Try again later.", {
        code: "RATE_LIMITED",
        status: 429,
      });
    }

    const body = await request.json().catch(() => null);
    const parsed = aiTutorSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Validation failed", {
        code: "VALIDATION_ERROR",
        status: 422,
        details: parsed.error.flatten(),
      });
    }

    const result = await askStudyTutor(user.id, parsed.data.message, {
      subject: parsed.data.subject,
      conversationId: parsed.data.conversationId,
      mode: parsed.data.mode,
      documentIds: parsed.data.documentIds,
    });

    void trackAnalyticsEvent({ eventName: "ai_tutor_opened" }, user.id);

    const safeReply = sanitizeTutorVisibleText(result.reply || "");
    const publicResult = { ...result, reply: safeReply };

    if (!publicResult.reply) {
      return fail("The AI service did not return an answer. Try again.", {
        code: "PROVIDER_UNAVAILABLE",
        status: 503,
      });
    }

    if (parsed.data.stream) {
      const encoder = new TextEncoder();
      const text = publicResult.reply;
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(text));
          controller.close();
        },
      });
      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
          "X-Conversation-Id": result.conversationId,
          "X-AI-Provider": result.provider,
        },
      });
    }

    return ok(publicResult, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof TutorProviderError) {
      return fail(error.message, {
        code: error.code,
        status: 503,
      });
    }
    safeLog("error", "AI tutor failed", { error: String(error) });
    return serverError("Tutor is temporarily unavailable.");
  }
}
