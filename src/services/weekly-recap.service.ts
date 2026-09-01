import { prisma } from "@/lib/db";
import { dayKeyInTz } from "@/services/gamification.service";
import { getDashboardMoneySummary } from "@/services/expense.service";

export async function buildWeeklyRecap(userId: string) {
  const profile = await prisma.studentProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error("NO_PROFILE");
  if (!profile.shareRecapsEnabled) {
    return { disabled: true as const };
  }

  const today = new Date(dayKeyInTz(profile.timezone));
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));

  const since = weekStart;
  const [tasksDone, sessions, quizzes, streak] = await Promise.all([
    prisma.assignment.count({
      where: {
        userId,
        status: { in: ["SUBMITTED", "GRADED"] },
        updatedAt: { gte: since },
      },
    }),
    prisma.studySession.findMany({
      where: { userId, completed: true, startedAt: { gte: since } },
    }),
    prisma.quizAttempt.findMany({
      where: { userId, createdAt: { gte: since } },
    }),
    prisma.streak.findUnique({
      where: { userId_type: { userId, type: "study" } },
    }),
  ]);

  const studyMinutes = sessions.reduce(
    (s, x) => s + (x.actualMinutes ?? 0),
    0
  );
  const avgScore =
    quizzes.length > 0
      ? Math.round(
          quizzes.reduce((s, q) => s + (q.score / Math.max(1, q.maxScore)) * 100, 0) /
            quizzes.length
        )
      : null;

  let moneySaved: number | null = null;
  try {
    const money = await getDashboardMoneySummary(userId);
    if (money.moneyLeft != null && money.pocketMoney != null) {
      moneySaved = Math.max(0, Math.round(money.moneyLeft));
    }
  } catch {
    moneySaved = null;
  }

  const payload = {
    tasksCompleted: tasksDone,
    studyMinutes,
    quizzesCompleted: quizzes.length,
    averageScore: avgScore,
    currentStreak: streak?.currentCount ?? 0,
    moneySaved,
    academicAura: profile.academicAura,
    displayName: profile.displayName || null,
    level: profile.level,
    xpTotal: profile.xpTotal,
  };

  const recap = await prisma.weeklyRecap.upsert({
    where: { userId_weekStart: { userId, weekStart } },
    create: {
      userId,
      weekStart,
      payload,
      hideIdentity: false,
    },
    update: { payload },
  });

  return { disabled: false as const, recap, payload };
}
