import { prisma } from "@/lib/db";
import {
  awardXp,
  incrementWeeklyChallenge,
  recordMeaningfulActivity,
  tryUnlock,
  recomputeAura,
} from "@/services/gamification.service";

export async function listStudySessions(userId: string) {
  return prisma.studySession.findMany({
    where: { userId },
    orderBy: { startedAt: "desc" },
    take: 30,
  });
}

export async function startStudySession(
  userId: string,
  input: { subject?: string; taskTitle?: string; plannedMinutes: number }
) {
  return prisma.studySession.create({
    data: {
      userId,
      subject: input.subject || null,
      taskTitle: input.taskTitle || null,
      plannedMinutes: input.plannedMinutes,
    },
  });
}

export async function completeStudySession(userId: string, id: string) {
  const row = await prisma.studySession.findFirst({ where: { id, userId } });
  if (!row) throw new Error("NOT_FOUND");
  if (row.completed) return { session: row, xp: null };

  const endedAt = new Date();
  const actualMinutes = Math.max(
    1,
    Math.round((endedAt.getTime() - row.startedAt.getTime()) / 60000)
  );
  const meaningful =
    actualMinutes >= 10 || actualMinutes >= Math.ceil(row.plannedMinutes * 0.5);

  const session = await prisma.studySession.updateMany({
    where: { id, userId, completed: false },
    data: { completed: true, endedAt, actualMinutes },
  });
  if (session.count === 0) {
    const current = await prisma.studySession.findFirst({ where: { id, userId } });
    return { session: current ?? row, xp: null, meaningful: false };
  }

  const completed = await prisma.studySession.findFirst({ where: { id, userId } });

  let xp = null;
  if (meaningful) {
    xp = await awardXp(
      userId,
      Math.min(50, 10 + actualMinutes),
      "study_session",
      "study_session"
    );
    await recordMeaningfulActivity(userId, "study");
    await tryUnlock(
      userId,
      "FIRST_SESSION",
      "Focus Starter",
      "Completed your first study session"
    );
    await recomputeAura(userId);
    await incrementWeeklyChallenge(userId, "five_sessions");
  }

  return { session: completed ?? row, xp, meaningful };
}

export async function listFlashcardDecks(userId: string) {
  return prisma.flashcardDeck.findMany({
    where: { userId },
    include: { _count: { select: { cards: true } } },
    orderBy: { updatedAt: "desc" },
  });
}

export async function createFlashcardDeck(
  userId: string,
  input: { title: string; subject?: string; cards?: { front: string; back: string }[] }
) {
  return prisma.flashcardDeck.create({
    data: {
      userId,
      title: input.title,
      subject: input.subject || null,
      cards: input.cards?.length
        ? {
            create: input.cards.map((c) => ({
              front: c.front,
              back: c.back,
            })),
          }
        : undefined,
    },
    include: { cards: true },
  });
}

export async function reviewFlashcard(
  userId: string,
  cardId: string,
  know: boolean
) {
  const card = await prisma.flashcard.findFirst({
    where: { id: cardId },
    include: { deck: true },
  });
  if (!card || card.deck.userId !== userId) throw new Error("NOT_FOUND");

  const intervalDays = know
    ? Math.max(1, card.intervalDays * 2 || 1)
    : 0;
  const dueAt = new Date();
  dueAt.setDate(dueAt.getDate() + intervalDays);

  return prisma.flashcard.update({
    where: { id: cardId },
    data: {
      intervalDays,
      easeFactor: know ? Math.min(3, card.easeFactor + 0.1) : Math.max(1.3, card.easeFactor - 0.2),
      dueAt: know ? dueAt : new Date(),
    },
  });
}

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/plain",
]);

export async function createUploadedDocument(
  userId: string,
  input: {
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    kind?: "PDF" | "IMAGE" | "NOTES" | "QUESTION_PAPER" | "SYLLABUS" | "ASSIGNMENT" | "TEXT" | "OTHER";
    textExcerpt?: string;
  }
) {
  if (!ALLOWED_MIME.has(input.mimeType)) {
    throw new Error("INVALID_TYPE");
  }
  if (input.sizeBytes > 5 * 1024 * 1024) {
    throw new Error("TOO_LARGE");
  }
  return prisma.uploadedDocument.create({
    data: {
      userId,
      fileName: input.fileName.slice(0, 200),
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      kind: input.kind || "OTHER",
      textExcerpt: input.textExcerpt?.slice(0, 20000) || null,
      storageKey: null,
    },
  });
}

export async function listUploadedDocuments(userId: string) {
  return prisma.uploadedDocument.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function deleteUploadedDocument(userId: string, id: string) {
  const row = await prisma.uploadedDocument.findFirst({ where: { id, userId } });
  if (!row) throw new Error("NOT_FOUND");
  await prisma.uploadedDocument.delete({ where: { id } });
}
