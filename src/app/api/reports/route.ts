import { getCurrentUser } from "@/lib/auth";
import { ok, serverError, unauthorized } from "@/lib/api";
import { getMonthlyReportForUser } from "@/services/report.service";
import { safeLog } from "@/lib/security/safe-log";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const report = await getMonthlyReportForUser(user.id);
    return ok({ report });
  } catch (error) {
    safeLog("error", "Report failed", { error: String(error) });
    return serverError();
  }
}
