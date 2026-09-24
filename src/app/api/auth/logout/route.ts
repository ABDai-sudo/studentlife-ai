import { logoutUser } from "@/services/auth.service";
import { ok, serverError } from "@/lib/api";
import { safeLog } from "@/lib/security/safe-log";

export async function POST() {
  try {
    await logoutUser();
    return ok({ loggedOut: true });
  } catch (error) {
    safeLog("error", "Logout failed", {
      route: "/api/auth/logout",
      error: error instanceof Error ? error.message.slice(0, 200) : "logout failed",
    });
    return serverError();
  }
}
