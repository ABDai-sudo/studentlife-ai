import { prisma } from "@/lib/db";
import { features } from "@/lib/features";
import {
  maybeEnqueueStreakReminder,
} from "@/services/notification.service";
import { evaluateMoneyGuardianAlerts } from "@/services/money-alerts.service";

/**
 * Lightweight engagement tick — safe to call from authenticated page/API loads.
 * Enqueues at most one streak reminder (idempotent) and evaluates money alerts.
 * Does not spam: underlying services use prefs + idempotency keys.
 */
export async function runEngagementTick(userId: string) {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    select: {
      timezone: true,
      personalityMode: true,
      xpTotal: true,
    },
  });
  if (!profile) return { streak: null, money: null };

  const streak = await prisma.streak.findUnique({
    where: { userId_type: { userId, type: "study" } },
  });

  const { dayKeyInTz } = await import("@/services/gamification.service");
  const todayKey = dayKeyInTz(profile.timezone);
  const lastKey = streak?.lastLoggedAt
    ? dayKeyInTz(profile.timezone, streak.lastLoggedAt)
    : null;
  const todayComplete = lastKey === todayKey;

  let streakNotif = null;
  if (features.studyNotifications) {
    streakNotif = await maybeEnqueueStreakReminder({
      userId,
      timezone: profile.timezone,
      streakCurrent: streak?.currentCount ?? 0,
      todayComplete,
      personalityMode: profile.personalityMode,
    });
  }

  let money = null;
  if (features.moneyGuardianAlerts) {
    money = await evaluateMoneyGuardianAlerts(userId);
  }

  return { streak: streakNotif, money };
}
