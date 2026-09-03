import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { fail, ok, serverError, unauthorized } from "@/lib/api";
import { features } from "@/lib/features";
import { campusCircleActionSchema } from "@/lib/validations/campus-circle";
import {
  CampusCircleError,
  getCampusCircleOverview,
  getCampusGroupDetail,
  runCampusCircleAction,
} from "@/services/campus-circle.service";
import { getRequestContext, isAllowedOrigin } from "@/lib/security/request";
import { persistentRateLimit } from "@/lib/security/persistent-rate-limit";
import { safeLog } from "@/lib/security/safe-log";
import { withDbRetry } from "@/lib/db";

function mapCampusError(error: CampusCircleError) {
  const status =
    error.code === "DISABLED" || error.code === "FORBIDDEN"
      ? 403
      : error.code === "NOT_FOUND"
        ? 404
        : error.code === "CONFLICT"
          ? 409
          : error.code === "BLOCKED"
            ? 403
            : 422;
  return fail(error.message, { code: error.code, status });
}

function limitForAction(action: string): { key: string; limit: number; windowSec: number } {
  if (action === "connect") return { key: "connect", limit: 12, windowSec: 3600 };
  if (action === "report") return { key: "report", limit: 8, windowSec: 3600 };
  if (action === "block" || action === "unblock")
    return { key: "block", limit: 20, windowSec: 3600 };
  if (action === "create_group" || action === "invite_to_group")
    return { key: "group", limit: 12, windowSec: 3600 };
  if (action === "react") return { key: "react", limit: 60, windowSec: 3600 };
  if (
    action === "study_invite" ||
    action === "quiz_challenge" ||
    action === "share_recap"
  ) {
    return { key: "invite", limit: 20, windowSec: 3600 };
  }
  return { key: "mutate", limit: 40, windowSec: 3600 };
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!features.campusCircle) {
      return fail("Campus Circle is not enabled.", {
        code: "DISABLED",
        status: 403,
      });
    }
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");
    if (groupId) {
      const parsedId = z.string().cuid().safeParse(groupId);
      if (!parsedId.success) {
        return fail("Invalid group", { code: "VALIDATION", status: 422 });
      }
      return ok(
        await withDbRetry(() => getCampusGroupDetail(user.id, parsedId.data))
      );
    }
    return ok(await withDbRetry(() => getCampusCircleOverview(user.id)));
  } catch (error) {
    if (error instanceof CampusCircleError) return mapCampusError(error);
    safeLog("error", "Campus Circle load failed", { error: String(error) });
    return serverError("Could not load Campus Circle.");
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
    if (!features.campusCircle) {
      return fail("Campus Circle is not enabled.", {
        code: "DISABLED",
        status: 403,
      });
    }

    const body = await request.json().catch(() => null);
    const parsed = campusCircleActionSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Validation failed", {
        code: "VALIDATION_ERROR",
        status: 422,
        details: parsed.error.flatten(),
      });
    }

    const bucket = limitForAction(parsed.data.action);
    const rl = await persistentRateLimit(`campus:${bucket.key}:${user.id}`, {
      limit: bucket.limit,
      windowSec: bucket.windowSec,
    });
    if (!rl.allowed) {
      return fail("Too many Campus Circle actions. Try again later.", {
        code: "RATE_LIMITED",
        status: 429,
      });
    }

    const result = await runCampusCircleAction(user.id, parsed.data);
    return ok(result);
  } catch (error) {
    if (error instanceof CampusCircleError) return mapCampusError(error);
    safeLog("error", "Campus Circle action failed", { error: String(error) });
    return serverError("Campus Circle action failed.");
  }
}
