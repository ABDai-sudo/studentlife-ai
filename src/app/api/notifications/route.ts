import { getCurrentUser } from "@/lib/auth";
import { fail, ok, serverError, unauthorized } from "@/lib/api";
import {
  getNotificationPreferences,
  listInAppNotifications,
  updateNotificationPreferences,
} from "@/services/notification.service";
import { getRequestContext, isAllowedOrigin } from "@/lib/security/request";
import type { Prisma } from "@prisma/client";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const [preferences, notifications] = await Promise.all([
      getNotificationPreferences(user.id),
      listInAppNotifications(user.id),
    ]);
    return ok({ preferences, notifications });
  } catch {
    return serverError("Could not load notifications.");
  }
}

export async function PATCH(req: Request) {
  try {
    const ctx = await getRequestContext();
    if (!isAllowedOrigin(ctx.origin)) {
      return fail("Invalid origin", { code: "FORBIDDEN", status: 403 });
    }
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const body = (await req.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!body) {
      return fail("Invalid body.", { code: "VALIDATION_ERROR", status: 422 });
    }

    const booleanKeys = [
      "pauseAll",
      "usePersonalityWording",
      "streakAtRisk",
      "streakFinalReminder",
      "dailyQuests",
      "assignmentDeadline",
      "upcomingExam",
      "focusReminder",
      "achievement",
      "weeklyRecap",
      "lowMoney",
      "overspending",
      "savingsGoal",
      "upcomingExpense",
      "safeSpendUpdate",
    ] as const;

    const data: Prisma.NotificationPreferenceUncheckedUpdateInput = {};
    for (const key of booleanKeys) {
      if (key in body) {
        if (typeof body[key] !== "boolean") {
          return fail("Validation failed", {
            code: "VALIDATION_ERROR",
            status: 422,
          });
        }
        data[key] = body[key];
      }
    }
    if ("quietHoursStart" in body) {
      const value = body.quietHoursStart;
      if (value !== null && typeof value !== "string") {
        return fail("Validation failed", { code: "VALIDATION_ERROR", status: 422 });
      }
      data.quietHoursStart = typeof value === "string" ? value : null;
    }
    if ("quietHoursEnd" in body) {
      const value = body.quietHoursEnd;
      if (value !== null && typeof value !== "string") {
        return fail("Validation failed", { code: "VALIDATION_ERROR", status: 422 });
      }
      data.quietHoursEnd = typeof value === "string" ? value : null;
    }
    if ("preferredReminderTime" in body) {
      if (typeof body.preferredReminderTime !== "string") {
        return fail("Validation failed", { code: "VALIDATION_ERROR", status: 422 });
      }
      data.preferredReminderTime = body.preferredReminderTime;
    }
    if ("timezone" in body) {
      if (typeof body.timezone !== "string") {
        return fail("Validation failed", { code: "VALIDATION_ERROR", status: 422 });
      }
      data.timezone = body.timezone;
    }
    if ("categoryWarnPercent" in body) {
      if (
        typeof body.categoryWarnPercent !== "number" ||
        !Number.isFinite(body.categoryWarnPercent)
      ) {
        return fail("Validation failed", { code: "VALIDATION_ERROR", status: 422 });
      }
      data.categoryWarnPercent = body.categoryWarnPercent;
    }
    if ("categoryHighPercent" in body) {
      if (
        typeof body.categoryHighPercent !== "number" ||
        !Number.isFinite(body.categoryHighPercent)
      ) {
        return fail("Validation failed", { code: "VALIDATION_ERROR", status: 422 });
      }
      data.categoryHighPercent = body.categoryHighPercent;
    }

    const preferences = await updateNotificationPreferences(user.id, data);
    return ok({ preferences });
  } catch {
    return serverError("Could not update notification preferences.");
  }
}
