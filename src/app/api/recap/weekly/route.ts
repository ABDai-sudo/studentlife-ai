import { getCurrentUser } from "@/lib/auth";
import { ok, serverError, unauthorized } from "@/lib/api";
import { buildWeeklyRecap } from "@/services/weekly-recap.service";
import { getRequestContext, isAllowedOrigin } from "@/lib/security/request";
import { fail } from "@/lib/api";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    return ok(await buildWeeklyRecap(user.id));
  } catch {
    return serverError("Could not build recap.");
  }
}

export async function POST() {
  try {
    const ctx = await getRequestContext();
    if (!isAllowedOrigin(ctx.origin)) {
      return fail("Invalid origin", { code: "FORBIDDEN", status: 403 });
    }
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    return ok(await buildWeeklyRecap(user.id));
  } catch {
    return serverError("Could not build recap.");
  }
}
