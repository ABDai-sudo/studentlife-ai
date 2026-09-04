import { prisma } from "@/lib/db";
import { EXAM_WINDOW_DAYS, zonedClock, civilDaysBetween, dayKeyFromDate } from "@/lib/avatar/contextual-status";
import { sanitizeInstitutionName } from "@/lib/avatar/speech";

export type AvatarCardContext = {
  institutionName: string | null;
  examSeasonActive: boolean;
  hasModelPapers: boolean;
  seed: string;
};

export async function getAvatarCardContext(
  userId: string,
  now = new Date()
): Promise<AvatarCardContext> {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    select: {
      institutionName: true,
      university: true,
      timezone: true,
    },
  });
  const timezone = profile?.timezone || "Asia/Kolkata";
  const clock = zonedClock(timezone, now);
  const lookback = new Date(now.getTime() - 2 * 86_400_000);
  const examUntil = new Date(now.getTime() + (EXAM_WINDOW_DAYS + 1) * 86_400_000);

  const [exams, paper] = await Promise.all([
    prisma.exam.findMany({
      where: { userId, examDate: { gte: lookback, lte: examUntil } },
      orderBy: { examDate: "asc" },
      take: 12,
      select: { examDate: true },
    }),
    prisma.generatedQuestionPaper.findFirst({
      where: { userId },
      select: { id: true },
    }),
  ]);

  const examDays = exams
    .map((row) =>
      civilDaysBetween(clock.dayKey, dayKeyFromDate(timezone, row.examDate))
    )
    .filter((days) => days >= 0)
    .sort((a, b) => a - b)[0];

  return {
    institutionName: sanitizeInstitutionName(
      profile?.institutionName || profile?.university
    ),
    examSeasonActive:
      examDays != null && examDays >= 0 && examDays <= EXAM_WINDOW_DAYS,
    hasModelPapers: Boolean(paper),
    seed: userId,
  };
}
