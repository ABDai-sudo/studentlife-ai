import { prisma } from "@/lib/db";
import { withNotificationSchema } from "@/lib/db/ensure-notification-schema";
import type { NotificationCategory, Prisma } from "@prisma/client";
import { features } from "@/lib/features";
import { dayKeyInTz } from "@/services/gamification.service";
import { notifyCopy } from "@/lib/i18n/notify";

export async function ensureNotificationPreferences(userId: string) {
  return withNotificationSchema(() =>
    prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId },
      update: {},
    })
  );
}

export async function getNotificationPreferences(userId: string) {
  return ensureNotificationPreferences(userId);
}

export async function updateNotificationPreferences(
  userId: string,
  data: Prisma.NotificationPreferenceUncheckedUpdateInput
) {
  await ensureNotificationPreferences(userId);
  return withNotificationSchema(() =>
    prisma.notificationPreference.update({
      where: { userId },
      data,
    })
  );
}

export async function listInAppNotifications(userId: string, take = 30) {
  return withNotificationSchema(() =>
    prisma.userNotification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take,
    })
  );
}

export async function markNotificationRead(userId: string, id: string) {
  const row = await prisma.userNotification.findFirst({
    where: { id, userId },
  });
  if (!row) return null;
  if (row.readAt) return row;
  return prisma.userNotification.update({
    where: { id },
    data: { readAt: new Date() },
  });
}

export async function snoozeNotification(
  userId: string,
  id: string,
  until: Date
) {
  const row = await prisma.userNotification.findFirst({
    where: { id, userId },
  });
  if (!row) return null;
  return prisma.userNotification.update({
    where: { id },
    data: { snoozedUntil: until },
  });
}

/**
 * Create an in-app notification with idempotency.
 * Skips when study notifications flag is off or preferences pause all.
 */
export async function enqueueInAppNotification(input: {
  userId: string;
  category: NotificationCategory;
  title: string;
  body: string;
  href?: string;
  idempotencyKey: string;
  metadata?: Prisma.InputJsonValue;
}) {
  if (!features.studyNotifications && !features.moneyGuardianAlerts) {
    return null;
  }

  const prefs = await ensureNotificationPreferences(input.userId);
  if (prefs.pauseAll) return null;

  try {
    return await prisma.userNotification.create({
      data: {
        userId: input.userId,
        category: input.category,
        title: input.title,
        body: input.body,
        href: input.href,
        idempotencyKey: input.idempotencyKey,
        metadata: input.metadata,
      },
    });
  } catch {
    return prisma.userNotification.findUnique({
      where: {
        userId_idempotencyKey: {
          userId: input.userId,
          idempotencyKey: input.idempotencyKey,
        },
      },
    });
  }
}

/**
 * Campus Circle transactional notices reuse user_notifications.
 * Independent of money-guardian / study-reminder feature flags.
 */
export async function enqueueCampusCircleNotification(input: {
  userId: string;
  title: string;
  body: string;
  href?: string;
  idempotencyKey: string;
  metadata?: Prisma.InputJsonValue;
}) {
  if (!features.campusCircle) return null;

  const prefs = await ensureNotificationPreferences(input.userId);
  if (prefs.pauseAll) return null;
  if (prefs.campusSocial === false) return null;

  try {
    return await prisma.userNotification.create({
      data: {
        userId: input.userId,
        category: "CAMPUS_CIRCLE",
        title: input.title,
        body: input.body,
        href: input.href ?? "/dashboard/campus-circle",
        idempotencyKey: input.idempotencyKey,
        metadata: input.metadata,
      },
    });
  } catch {
    return prisma.userNotification.findUnique({
      where: {
        userId_idempotencyKey: {
          userId: input.userId,
          idempotencyKey: input.idempotencyKey,
        },
      },
    });
  }
}

export async function markAllNotificationsRead(userId: string) {
  return withNotificationSchema(() =>
    prisma.userNotification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    })
  );
}

/** Local hour (0–23) in the student's timezone. */
function hourInTimezone(timezone: string, date = new Date()): number {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      hour: "numeric",
      hourCycle: "h23",
    }).formatToParts(date);
    return Number(parts.find((p) => p.type === "hour")?.value ?? 12);
  } catch {
    return date.getHours();
  }
}

/**
 * Smart streak reminders — timezone-aware, preference-gated, non-spammy.
 * Morning: none. Afternoon: gentle. Evening: stronger. Late: optional final.
 */
export async function maybeEnqueueStreakReminder(input: {
  userId: string;
  timezone: string;
  streakCurrent: number;
  todayComplete: boolean;
  personalityMode: string;
}) {
  if (!features.studyNotifications) return null;
  if (input.todayComplete || input.streakCurrent <= 0) return null;

  const hour = hourInTimezone(input.timezone);
  if (hour < 12) return null; // morning — no streak warning

  const prefs = await ensureNotificationPreferences(input.userId);
  if (prefs.pauseAll || !prefs.streakAtRisk) return null;

  const day = dayKeyInTz(input.timezone);
  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: input.userId },
    select: { preferredUiLanguage: true },
  });
  const uiLang = studentProfile?.preferredUiLanguage;

  const { getCopy } = await import("@/lib/personality");
  const mode = input.personalityMode as
    | "PROFESSIONAL"
    | "FRIENDLY"
    | "CAMPUS_BRO"
    | "CHRONICALLY_ONLINE"
    | "ACADEMIC_VILLAIN";
  const copy = getCopy(mode);
  const usePersonality =
    prefs.usePersonalityWording !== false &&
    (!uiLang || uiLang === "English");

  const fillN = (template: string) =>
    template.replaceAll("{n}", String(input.streakCurrent));

  // Windowed reminders with separate idempotency keys (max ~2–3/day when incomplete).
  let windowKey: string;
  let title: string;
  let body: string;

  if (hour < 17) {
    windowKey = `streak-gentle:${input.userId}:${day}`;
    title = notifyCopy("notif.streakAtRiskTitle", uiLang);
    body = usePersonality
      ? fillN(copy.streaks.atRisk)
      : notifyCopy("notif.streakAtRisk", uiLang);
  } else if (hour < 22) {
    windowKey = `streak-risk:${input.userId}:${day}`;
    title =
      usePersonality && mode !== "PROFESSIONAL"
        ? "Streak still fighting"
        : notifyCopy("notif.streakAtRiskTitle", uiLang);
    body = usePersonality
      ? fillN(copy.streaks.atRisk)
      : notifyCopy("notif.streakAtRisk", uiLang);
  } else {
    if (!prefs.streakFinalReminder) return null;
    windowKey = `streak-final:${input.userId}:${day}`;
    title = notifyCopy("notif.streakAtRiskTitle", uiLang);
    body = usePersonality
      ? fillN(copy.streaks.atRisk)
      : notifyCopy("notif.streakAtRisk", uiLang);
  }

  return enqueueInAppNotification({
    userId: input.userId,
    category: "STREAK_AT_RISK",
    title,
    body,
    href: "/dashboard/games",
    idempotencyKey: windowKey,
  });
}
