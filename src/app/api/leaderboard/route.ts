import { getCurrentUser } from "@/lib/auth";
import { ok, serverError, unauthorized } from "@/lib/api";
import { features } from "@/lib/features";
import { getGlobalLeaderboard } from "@/services/leaderboard.service";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    if (!features.leaderboard) {
      return ok({
        enabled: false,
        entries: [],
        viewer: null,
        totalOptedIn: 0,
      });
    }

    const data = await getGlobalLeaderboard(user.id);
    return ok(data);
  } catch {
    return serverError("Could not load leaderboard.");
  }
}

/** Avoid caching public-ish rankings across users. */
export const dynamic = "force-dynamic";
