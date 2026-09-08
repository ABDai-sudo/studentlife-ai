import { prisma } from "@/lib/db";
import { listAssignments, listSubjects } from "@/services/academics.service";

export const LEVELS = [
  { level: 1, xp: 0, name: "Getting started" },
  { level: 2, xp: 100, name: "Focused learner" },
  { level: 3, xp: 300, name: "On schedule" },
  { level: 4, xp: 600, name: "Consistent" },
  { level: 5, xp: 1000, name: "Strong semester" },
  { level: 6, xp: 1500, name: "Exam ready" },
  { level: 7, xp: 2500, name: "Top of class" },
] as const;

const DAILY_CAPS: Record<string, number> = {
  study_session: 100,
  quiz: 80,
  quest: 90,
  weekly: 200,
  assignment_task: 60,
  notes_review: 40,
  emergency_plan: 30,
  study_buddy: 60,
  default: 50,
};

export function dayKeyInTz(timeZone: string, date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Monday 00:00 UTC of the civil week that contains `date` in `timeZone`. */
export function weekStartDateInTz(timeZone: string, date = new Date()): Date {
  const key = dayKeyInTz(timeZone, date);
  const [year, month, day] = key.split("-").map(Number);
  const utcMs = Date.UTC(year, (month ?? 1) - 1, day ?? 1);
  const weekday = new Date(utcMs).getUTCDay(); // 0 Sun … 6 Sat
  const mondayOffset = (weekday + 6) % 7;
  return new Date(utcMs - mondayOffset * 86_400_000);
}

export function levelFromXp(xp: number) {
  let current: (typeof LEVELS)[number] = LEVELS[0];
  for (const row of LEVELS) {
    if (xp >= row.xp) current = row;
  }
  return current;
}

export async function awardXp(
  userId: string,
  amount: number,
  reason: string,
  capKey = "default"
) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`
      SELECT id FROM student_profiles WHERE user_id = ${userId} FOR UPDATE
    `;
    const profile = await tx.studentProfile.findUnique({ where: { userId } });
    if (!profile) throw new Error("NO_PROFILE");
    const dayKey = dayKeyInTz(profile.timezone);
    const cap = DAILY_CAPS[capKey] ?? DAILY_CAPS.default;
    const reasonKey = `${capKey}:${reason}`;

    // Quests and weekly challenges: one XP grant per reason per day.
    if (capKey === "quest" || capKey === "weekly") {
      const dup = await tx.xpTransaction.findFirst({
        where: { userId, dayKey, reason: reasonKey },
        select: { id: true },
      });
      if (dup) {
        return {
          awarded: 0,
          total: profile.xpTotal,
          level: profile.level,
          levelName: levelFromXp(profile.xpTotal).name,
        };
      }
    }

    const spent = await tx.xpTransaction.aggregate({
      where: { userId, dayKey, reason: { startsWith: capKey } },
      _sum: { amount: true },
    });
    const already = spent._sum.amount ?? 0;
    const room = Math.max(0, cap - already);
    const awarded = Math.min(amount, room);
    if (awarded <= 0) {
      return {
        awarded: 0,
        total: profile.xpTotal,
        level: profile.level,
        levelName: levelFromXp(profile.xpTotal).name,
      };
    }

    await tx.xpTransaction.create({
      data: {
        userId,
        amount: awarded,
        reason: reasonKey,
        dayKey,
      },
    });

    const xpTotal = profile.xpTotal + awarded;
    const lvl = levelFromXp(xpTotal);
    await tx.studentProfile.update({
      where: { userId },
      data: { xpTotal, level: lvl.level },
    });

    return {
      awarded,
      total: xpTotal,
      level: lvl.level,
      levelName: lvl.name,
    };
  });
}

export async function recordMeaningfulActivity(
  userId: string,
  activityKind: "study" | "quest" | "quiz" | "task" = "study"
) {
  // Product rule: all meaningful activity feeds the study streak counter.
  void activityKind;
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`
      SELECT id FROM student_profiles WHERE user_id = ${userId} FOR UPDATE
    `;
    const profile = await tx.studentProfile.findUnique({ where: { userId } });
    if (!profile) return null;
    const todayKey = dayKeyInTz(profile.timezone);
    const today = new Date(`${todayKey}T00:00:00.000Z`);

    const streak = await tx.streak.upsert({
      where: { userId_type: { userId, type: "study" } },
      create: {
        userId,
        type: "study",
        currentCount: 1,
        bestCount: 1,
        lastLoggedAt: today,
      },
      update: {},
    });

    const last = streak.lastLoggedAt
      ? dayKeyInTz(profile.timezone, streak.lastLoggedAt)
      : null;
    if (last === todayKey) {
      return streak;
    }

    const yKey = new Date(today.getTime() - 86_400_000)
      .toISOString()
      .slice(0, 10);
    const continued = last === yKey;
    const currentCount = continued ? streak.currentCount + 1 : 1;
    const bestCount = Math.max(streak.bestCount, currentCount);

    return tx.streak.update({
      where: { id: streak.id },
      data: {
        currentCount,
        bestCount,
        lastLoggedAt: today,
      },
    });
  });
}

export async function ensureDailyQuests(
  userId: string,
  profileRow?: { timezone: string; weakSubjects: string | null } | null
) {
  const profile =
    profileRow ??
    (await prisma.studentProfile.findUnique({ where: { userId } }));
  if (!profile) return [];
  const questDate = new Date(dayKeyInTz(profile.timezone));

  const existing = await prisma.dailyQuest.findMany({
    where: { userId, questDate },
  });
  if (existing.length >= 3) return existing;

  const [assignments, subjects, noteCount] = await Promise.all([
    listAssignments(userId),
    listSubjects(userId),
    prisma.note.count({ where: { userId } }),
  ]);

  const pending = assignments.find(
    (a) => a.status === "PENDING" || a.status === "IN_PROGRESS"
  );
  const weak =
    profile.weakSubjects?.split(",")[0]?.trim() || subjects[0]?.name || "a subject";

  const seeds = [
    {
      code: "assignment_push",
      title: pending
        ? `Make progress on “${pending.title.slice(0, 40)}”`
        : "Add or complete one assignment task",
      description: "One meaningful homework action",
      xpReward: 30,
    },
    {
      code: "study_block",
      title: `Study ${weak} for 25 minutes`,
      description: "Complete a Focus Sprint or study session",
      xpReward: 35,
    },
    {
      code: noteCount
        ? "notes_review"
        : "quiz_five",
      title: noteCount
        ? "Review one set of notes"
        : "Complete a 5-question practice set",
      description: noteCount
        ? "Open notes and mark a section reviewed"
        : "Use Question Generator or Quiz Rush",
      xpReward: 25,
    },
  ];

  await prisma.dailyQuest.createMany({
    data: seeds.map((seed) => ({
      userId,
      questDate,
      code: seed.code,
      title: seed.title,
      description: seed.description,
      xpReward: seed.xpReward,
      target: 1,
      progress: 0,
    })),
    skipDuplicates: true,
  });

  return prisma.dailyQuest.findMany({
    where: { userId, questDate },
    orderBy: { createdAt: "asc" },
  });
}

export async function completeQuest(userId: string, questId: string) {
  const quest = await prisma.dailyQuest.findFirst({
    where: { id: questId, userId },
  });
  if (!quest) throw new Error("NOT_FOUND");
  if (quest.status === "COMPLETED") return { quest, xp: null };

  const claimed = await prisma.dailyQuest.updateMany({
    where: { id: questId, userId, status: { not: "COMPLETED" } },
    data: {
      status: "COMPLETED",
      progress: quest.target,
      completedAt: new Date(),
    },
  });
  if (claimed.count === 0) {
    const current = await prisma.dailyQuest.findFirst({
      where: { id: questId, userId },
    });
    return { quest: current ?? quest, xp: null };
  }

  const updated = await prisma.dailyQuest.findFirst({
    where: { id: questId, userId },
  });
  const xp = await awardXp(userId, quest.xpReward, quest.code, "quest");
  await recordMeaningfulActivity(userId, "quest");
  await tryUnlock(
    userId,
    "FIRST_QUEST",
    "Quest Starter",
    "Completed your first daily quest"
  );
  await recomputeAura(userId);
  return { quest: updated ?? quest, xp };
}

export async function ensureWeeklyChallenges(userId: string) {
  const profile = await prisma.studentProfile.findUnique({ where: { userId } });
  if (!profile) return [];
  const weekStart = weekStartDateInTz(profile.timezone);

  const seeds = [
    {
      code: "five_sessions",
      title: "Complete five study sessions",
      target: 5,
      xpReward: 120,
    },
    {
      code: "three_quizzes",
      title: "Complete three quizzes",
      target: 3,
      xpReward: 100,
    },
    {
      code: "high_priority_tasks",
      title: "Finish all high-priority tasks",
      target: 1,
      xpReward: 100,
    },
  ];

  await prisma.weeklyChallenge.createMany({
    data: seeds.map((seed) => ({
      userId,
      weekStart,
      title: seed.title,
      code: seed.code,
      target: seed.target,
      xpReward: seed.xpReward,
    })),
    skipDuplicates: true,
  });

  return prisma.weeklyChallenge.findMany({
    where: { userId, weekStart },
  });
}

export async function incrementWeeklyChallenge(
  userId: string,
  code: string,
  by = 1
) {
  await ensureWeeklyChallenges(userId);
  const profile = await prisma.studentProfile.findUnique({ where: { userId } });
  if (!profile) return null;
  const weekStart = weekStartDateInTz(profile.timezone);

  const result = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`
      SELECT id FROM student_profiles WHERE user_id = ${userId} FOR UPDATE
    `;
    const row = await tx.weeklyChallenge.findUnique({
      where: { userId_weekStart_code: { userId, weekStart, code } },
    });
    if (!row || row.status === "COMPLETED") {
      return {
        updated: row,
        award: false as const,
        xpReward: 0,
        code: row?.code ?? code,
      };
    }

    const progress = Math.min(row.target, row.progress + by);
    const done = progress >= row.target;
    const updated = await tx.weeklyChallenge.update({
      where: { id: row.id },
      data: {
        progress,
        status: done ? "COMPLETED" : row.status,
      },
    });
    return {
      updated,
      award: done,
      xpReward: row.xpReward,
      code: row.code,
    };
  });

  if (!result) return null;
  if (result.award) {
    await awardXp(userId, result.xpReward, result.code, "weekly");
    await recordMeaningfulActivity(userId, "quest");
  }
  return result.updated;
}

export async function recomputeAura(userId: string) {
  const profile = await prisma.studentProfile.findUnique({ where: { userId } });
  if (!profile) return 50;
  const streak = await prisma.streak.findUnique({
    where: { userId_type: { userId, type: "study" } },
  });
  const quests = await prisma.dailyQuest.count({
    where: {
      userId,
      status: "COMPLETED",
      completedAt: { gte: new Date(Date.now() - 7 * 86400000) },
    },
  });
  const sessions = await prisma.studySession.count({
    where: {
      userId,
      completed: true,
      startedAt: { gte: new Date(Date.now() - 7 * 86400000) },
    },
  });

  let aura = 45;
  aura += Math.min(20, (streak?.currentCount ?? 0) * 2);
  aura += Math.min(20, quests * 3);
  aura += Math.min(15, sessions * 2);
  aura = Math.max(20, Math.min(100, Math.round(aura)));

  await prisma.studentProfile.update({
    where: { userId },
    data: { academicAura: aura },
  });
  return aura;
}

export async function tryUnlock(
  userId: string,
  code: string,
  title: string,
  description?: string
) {
  return prisma.achievement.upsert({
    where: { userId_code: { userId, code } },
    create: { userId, code, title, description },
    update: {},
  });
}

export async function getProgressSummary(userId: string) {
  const { resolveStudentStatusForUser, ensureAvatarStatusAutoColumn } = await import(
    "@/services/student-status.service"
  );
  await ensureAvatarStatusAutoColumn();
  const profile = await prisma.studentProfile.findUnique({ where: { userId } });
  const [quests, challenges, streak, achievements] = await Promise.all([
    ensureDailyQuests(userId, profile),
    ensureWeeklyChallenges(userId),
    prisma.streak.findUnique({
      where: { userId_type: { userId, type: "study" } },
    }),
    prisma.achievement.findMany({
      where: { userId },
      orderBy: { unlockedAt: "desc" },
      take: 20,
    }),
  ]);
  const lvl = levelFromXp(profile?.xpTotal ?? 0);
  const xpTotal = profile?.xpTotal ?? 0;
  const nextLevel = LEVELS.find((row) => row.level === lvl.level + 1);
  const nextAt = nextLevel?.xp ?? lvl.xp;
  const prevAt = lvl.xp;
  const span = Math.max(1, nextAt - prevAt);
  const levelProgress = nextLevel
    ? Math.min(100, Math.round(((xpTotal - prevAt) / span) * 100))
    : 100;
  const xpToNext = nextLevel ? Math.max(0, nextAt - xpTotal) : 0;
  const todayKey = dayKeyInTz(profile?.timezone ?? "Asia/Kolkata");
  const lastKey = streak?.lastLoggedAt
    ? dayKeyInTz(profile?.timezone ?? "Asia/Kolkata", streak.lastLoggedAt)
    : null;
  const todayComplete = lastKey === todayKey;
  const questsDone = quests.filter((q) => q.status === "COMPLETED").length;
  const questsTotal = quests.length;
  const achievementCodes = achievements.map((a) => a.code);

  const { deriveAvatarFrame, frameToUiRing } = await import(
    "@/lib/avatar/presets"
  );
  const cosmeticFrame = deriveAvatarFrame({
    streakCurrent: streak?.currentCount ?? 0,
    xpTotal,
    academicAura: profile?.academicAura ?? 50,
    achievementCodes,
  });
  const resolved = await resolveStudentStatusForUser(userId, {
    avatarStatus: profile?.avatarStatus ?? null,
    avatarStatusAuto: profile?.avatarStatusAuto,
    timezone: profile?.timezone,
  });

  return {
    xpTotal,
    level: lvl.level,
    levelName: lvl.name,
    xpToNext,
    levelProgress,
    academicAura: profile?.academicAura ?? 50,
    displayName: profile?.displayName ?? null,
    avatarPresetId: profile?.avatarPresetId ?? null,
    avatarImageUrl: profile?.avatarImageUrl ?? null,
    avatarStatus: resolved.status,
    avatarStatusPinned: profile?.avatarStatus ?? null,
    avatarStatusAuto: profile?.avatarStatusAuto !== false,
    avatarPresence: resolved.presence,
    avatarStatusSource: resolved.source,
    avatarStatusLive: resolved.live,
    leaderboardOptIn: profile?.leaderboardOptIn ?? false,
    cosmeticFrame,
    avatarFrameUi: frameToUiRing(cosmeticFrame),
    todayComplete,
    questsDone,
    questsTotal,
    streak: streak
      ? {
          current: streak.currentCount,
          best: streak.bestCount,
          lastLoggedAt: streak.lastLoggedAt,
        }
      : { current: 0, best: 0, lastLoggedAt: null },
    streakFreezeCount: profile?.streakFreezeCount ?? 0,
    quests,
    challenges,
    achievements,
  };
}
