import { getCurrentUser } from "@/lib/auth";
import { fail, ok, serverError, unauthorized } from "@/lib/api";
import { studyBuddyActionSchema } from "@/lib/validations/ai-tools";
import {
  askStudyBuddy,
  completeStudyBuddyItem,
  continueBuddySession,
  generateStudyBuddyPlan,
  getStudyBuddyConversation,
  getStudyBuddyOverview,
  saveStudyBuddyChat,
  startBuddySession,
} from "@/services/study-buddy.service";
import { getRequestContext, isAllowedOrigin } from "@/lib/security/request";
import { rateLimit } from "@/lib/security/rate-limit";
import { safeLog } from "@/lib/security/safe-log";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");
    if (conversationId) {
      const convo = await getStudyBuddyConversation(user.id, conversationId);
      if (!convo) return fail("Not found", { code: "NOT_FOUND", status: 404 });
      return ok(convo);
    }
    return ok(await getStudyBuddyOverview(user.id));
  } catch (error) {
    safeLog("error", "Study Buddy load failed", { error: String(error) });
    return serverError("Could not load Study Buddy.");
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

    const rl = rateLimit(`ai:buddy:${user.id}`, { limit: 40, windowSec: 3600 });
    if (!rl.allowed) {
      return fail("Too many Study Buddy requests. Try again later.", {
        code: "RATE_LIMITED",
        status: 429,
      });
    }

    const body = await request.json().catch(() => null);
    const parsed = studyBuddyActionSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Validation failed", {
        code: "VALIDATION_ERROR",
        status: 422,
        details: parsed.error.flatten(),
      });
    }

    const { action } = parsed.data;
    switch (action) {
      case "generate_plan":
        return ok(await generateStudyBuddyPlan(user.id));
      case "generate_session":
        return ok(
          await startBuddySession(user.id, {
            plannedMinutes: parsed.data.plannedMinutes,
          })
        );
      case "quick_revision":
        return ok(
          await startBuddySession(user.id, {
            plannedMinutes: parsed.data.plannedMinutes ?? 20,
            quick: true,
          })
        );
      case "continue_session":
        return ok(await continueBuddySession(user.id, false));
      case "complete_session":
        return ok(await continueBuddySession(user.id, true));
      case "complete_item":
        return ok(
          await completeStudyBuddyItem(user.id, parsed.data.itemId as string)
        );
      case "chat":
        return ok(
          await askStudyBuddy(
            user.id,
            parsed.data.message as string,
            parsed.data.conversationId
          )
        );
      case "save_chat":
        return ok(
          await saveStudyBuddyChat(user.id, parsed.data.conversationId as string)
        );
      default:
        return fail("Unknown action", { code: "VALIDATION_ERROR", status: 422 });
    }
  } catch (error) {
    if (String(error).includes("NOT_FOUND")) {
      return fail("Not found", { code: "NOT_FOUND", status: 404 });
    }
    safeLog("error", "Study Buddy action failed", { error: String(error) });
    return serverError("Study Buddy is temporarily unavailable.");
  }
}
