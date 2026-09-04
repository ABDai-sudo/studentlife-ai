import { prisma, withDbRetry } from "@/lib/db";
import {
  civilDaysBetween,
  dayKeyFromDate,
  isCurrentClassSlot,
  isLiveStudySession,
  resolveStudentStatus,
  zonedClock,
  type ResolvedStudentStatus,
} from "@/lib/avatar/contextual-status";

let ensurePromise: Promise<void> | null = null;

export async function ensureAvatarStatusAutoColumn() {
  if (!ensurePromise) {
    ensurePromise = withDbRetry(() =>
      prisma.$executeRawUnsafe(
        `ALTER TABLE "student_profiles" ADD COLUMN IF NOT EXISTS "avatar_status_auto" BOOLEAN NOT NULL DEFAULT true`
      )
    )
      .then(() => undefined)
      .catch(() => undefined);
  }
  await ensurePromise;
}

export type StudentStatusInput = {
  avatarStatus: string | null;
  avatarStatusAuto?: boolean | null;
  timezone?: string | null;
};

export async function resolveStudentStatusForUser(
  userId: string,
  profile: StudentStatusInput,
  now = new Date()
): Promise<ResolvedStudentStatus> {
  await ensureAvatarStatusAutoColumn();
  const timezone = profile.timezone || "Asia/Kolkata";
  const clock = zonedClock(timezone, now);
  const lookback = new Date(now.getTime() - 2 * 86_400_000);
  const examUntil = new Date(now.getTime() + 8 * 86_400_000);
  const dueUntil = new Date(now.getTime() + 4 * 86_400_000);

  const [session, slots, exams, assignments] = await Promise.all([
    prisma.studySession.findFirst({
      where: { userId, completed: false, endedAt: null },
      orderBy: { startedAt: "desc" },
      select: { completed: true, endedAt: true, startedAt: true },
    }),
    prisma.timetableSlot.findMany({
      where: { userId, dayOfWeek: clock.weekday },
      select: { dayOfWeek: true, startTime: true, endTime: true },
    }),
    prisma.exam.findMany({
      where: { userId, examDate: { gte: lookback, lte: examUntil } },
      orderBy: { examDate: "asc" },
      take: 12,
      select: { examDate: true },
    }),
    prisma.assignment.findMany({
      where: {
        userId,
        status: { in: ["PENDING", "IN_PROGRESS", "OVERDUE"] },
        dueDate: { gte: lookback, lte: dueUntil },
      },
      orderBy: { dueDate: "asc" },
      take: 12,
      select: { dueDate: true },
    }),
  ]);

  const hasLiveSession = session
    ? isLiveStudySession({
        completed: session.completed,
        endedAt: session.endedAt,
        startedAt: session.startedAt,
        now,
      })
    : false;

  const hasCurrentClass = slots.some((slot) =>
    isCurrentClassSlot({
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      nowWeekday: clock.weekday,
      nowMinutes: clock.minutes,
    })
  );

  const examDays = exams
    .map((row) => civilDaysBetween(clock.dayKey, dayKeyFromDate(timezone, row.examDate)))
    .filter((days) => days >= 0)
    .sort((a, b) => a - b)[0];
  const dueDays = assignments
    .map((row) =>
      civilDaysBetween(clock.dayKey, dayKeyFromDate(timezone, row.dueDate))
    )
    .sort((a, b) => a - b)[0];

  return resolveStudentStatus({
    autoEnabled: profile.avatarStatusAuto !== false,
    manualStatus: profile.avatarStatus,
    hasLiveSession,
    hasCurrentClass,
    examWithinDays: examDays ?? null,
    assignmentDueWithinDays: dueDays ?? null,
  });
}
