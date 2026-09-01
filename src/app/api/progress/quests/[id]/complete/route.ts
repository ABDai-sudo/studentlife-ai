import { getCurrentUser } from "@/lib/auth";
import { fail, ok, serverError, unauthorized } from "@/lib/api";
import { completeQuest } from "@/services/gamification.service";
import { getRequestContext, isAllowedOrigin } from "@/lib/security/request";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await getRequestContext();
    if (!isAllowedOrigin(ctx.origin)) {
      return fail("Invalid origin", { code: "FORBIDDEN", status: 403 });
    }
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;
    const result = await completeQuest(user.id, id);
    return ok(result);
  } catch (error) {
    if (String(error).includes("NOT_FOUND")) {
      return fail("Not found", { code: "NOT_FOUND", status: 404 });
    }
    return serverError("Could not complete quest.");
  }
}
