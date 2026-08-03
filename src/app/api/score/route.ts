import { getCurrentUser } from "@/lib/auth";
import { ok, serverError, unauthorized } from "@/lib/api";
import { computeFinancialScoreForUser } from "@/services/score.service";
import { safeLog } from "@/lib/security/safe-log";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const score = await computeFinancialScoreForUser(user.id, true);
    return ok({ score });
  } catch (error) {
    safeLog("error", "Score compute failed", { error: String(error) });
    return serverError();
  }
}
