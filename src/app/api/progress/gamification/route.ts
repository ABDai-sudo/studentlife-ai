import { getCurrentUser } from "@/lib/auth";
import { ok, serverError, unauthorized } from "@/lib/api";
import { getProgressSummary } from "@/services/gamification.service";
import { runEngagementTick } from "@/services/engagement-tick.service";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const summary = await getProgressSummary(user.id);
    // Non-blocking engagement evaluators (idempotent / preference-gated).
    void runEngagementTick(user.id).catch(() => undefined);
    return ok(summary);
  } catch {
    return serverError("Could not load progress.");
  }
}
