import { prisma } from "@/lib/db";
import {
  awardXp,
  incrementWeeklyChallenge,
  recordMeaningfulActivity,
  recomputeAura,
  tryUnlock,
} from "@/services/gamification.service";

export async function createQuizAttempt(
  userId: string,
  input: {
    title: string;
    score: number;
    maxScore: number;
    durationSec?: number;
  }
) {
  const row = await prisma.quizAttempt.create({
    data: {
      userId,
      title: input.title,
      score: input.score,
      maxScore: input.maxScore,
      durationSec: input.durationSec ?? null,
    },
  });

  const xp = await awardXp(
    userId,
    Math.min(40, 10 + input.score * 5),
    "quiz_rush",
    "quiz"
  );
  await recordMeaningfulActivity(userId, "quiz");
  await tryUnlock(
    userId,
    "QUIZ_CHAMPION",
    "Quiz Champion",
    "Completed a Quiz Rush"
  );
  if (input.score === input.maxScore) {
    await tryUnlock(
      userId,
      "PERFECT_QUIZ",
      "Perfect Round",
      "Scored 100% on Quiz Rush"
    );
  }
  await recomputeAura(userId);
  await incrementWeeklyChallenge(userId, "three_quizzes");

  return { attempt: row, xp };
}
