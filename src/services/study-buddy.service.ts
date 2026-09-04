import type { Prisma, StudyBuddyItemKind } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  listAssignments,
  listExams,
  listSubjects,
  listTimetable,
} from "@/services/academics.service";
import {
  appendMessage,
  createConversation,
  getConversation,
  listConversations,
  pinConversation,
} from "@/services/ai-conversation.service";
import { explanationLanguageRule } from "@/services/ai/context";
import { completeChat } from "@/services/ai/provider";
import {
  awardXp,
  dayKeyInTz,
  recordMeaningfulActivity,
} from "@/services/gamification.service";
import {
  completeStudySession,
  listStudySessions,
  startStudySession,
} from "@/services/study-tools.service";

export const STUDY_BUDDY_SUBJECT = "STUDY_BUDDY";

type DraftItem = {
  kind: StudyBuddyItemKind;
  title: string;
  subject: string | null;
  sourceType: string | null;
  sourceId: string | null;
  minutes: number;
  fromDatabase: boolean;
  reason: string;
};

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfTodayUtc(dayKey: string): Date {
  return new Date(`${dayKey}T00:00:00.000Z`);
}

function daysUntil(date: Date, now: Date): number {
  return Math.ceil((date.getTime() - now.getTime()) / 86_400_000);
}

function weekdayInTz(timeZone: string, date = new Date()): number {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(date);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
}

function hmNow(timeZone: string, date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function splitList(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;\n]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 8);
}

async function gatherFacts(userId: string) {
  const [
    profile,
    subjects,
    assignments,
    exams,
    notes,
    timetable,
    sessions,
    quizAttempts,
    cgpa,
  ] = await Promise.all([
    prisma.studentProfile.findUnique({ where: { userId } }),
    listSubjects(userId),
    listAssignments(userId),
    listExams(userId),
    prisma.note.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        subject: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    listTimetable(userId),
    listStudySessions(userId),
    prisma.quizAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.cgpaRecord.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const timeZone = profile?.timezone || "Asia/Kolkata";
  const now = new Date();
  const dayKey = dayKeyInTz(timeZone, now);
  const today = startOfTodayUtc(dayKey);
  const todayWeekday = weekdayInTz(timeZone, now);
  const clock = hmNow(timeZone, now);

  const pending = assignments.filter(
    (a) => a.status === "PENDING" || a.status === "IN_PROGRESS" || a.status === "OVERDUE"
  );
  const overdue = pending.filter((a) => a.dueDate.getTime() < today.getTime());
  const dueSoon = pending
    .filter((a) => {
      const d = daysUntil(a.dueDate, today);
      return d >= 0 && d <= 3;
    })
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  const upcomingExams = exams
    .filter((e) => e.examDate.getTime() >= today.getTime() - 86_400_000)
    .sort((a, b) => a.examDate.getTime() - b.examDate.getTime());

  const todaySlots = timetable
    .filter((s) => s.dayOfWeek === todayWeekday)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const nextSlot =
    todaySlots.find((s) => s.startTime >= clock) ?? todaySlots[0] ?? null;

  const openSession = sessions.find((s) => !s.completed) ?? null;

  const reportedWeak = splitList(profile?.weakSubjects);
  const quizWeak = quizAttempts
    .filter((q) => q.maxScore > 0 && q.score / q.maxScore < 0.55)
    .map((q) => q.title)
    .filter(Boolean);
  const cgpaWeak = cgpa
    .filter((row) => row.gradePoint < 6)
    .map((row) => row.subject);
  const weakTopics = Array.from(
    new Set([...reportedWeak, ...quizWeak, ...cgpaWeak])
  ).slice(0, 6);

  const explanationLang = profile?.preferredExplanationLang || "English";

  return {
    timeZone,
    dayKey,
    today,
    clock,
    explanationLang,
    dailyStudyMinutes: profile?.dailyStudyMinutes ?? null,
    subjects: subjects.map((s) => ({ id: s.id, name: s.name })),
    pending: pending.map((a) => ({
      id: a.id,
      title: a.title,
      subject: a.subject,
      dueDate: isoDate(a.dueDate),
      status: a.status,
      overdue: a.dueDate.getTime() < today.getTime(),
    })),
    overdue: overdue.map((a) => ({
      id: a.id,
      title: a.title,
      subject: a.subject,
      dueDate: isoDate(a.dueDate),
    })),
    dueSoon: dueSoon.map((a) => ({
      id: a.id,
      title: a.title,
      subject: a.subject,
      dueDate: isoDate(a.dueDate),
    })),
    exams: upcomingExams.slice(0, 6).map((e) => ({
      id: e.id,
      title: e.title,
      subject: e.subject,
      examDate: isoDate(e.examDate),
      days: daysUntil(e.examDate, today),
    })),
    notes: notes.map((n) => ({
      id: n.id,
      title: n.title,
      subject: n.subject?.name ?? null,
    })),
    todaySlots: todaySlots.map((s) => ({
      id: s.id,
      title: s.title,
      startTime: s.startTime,
      endTime: s.endTime,
      subject: s.subject?.name ?? null,
      location: s.location,
    })),
    nextSlot: nextSlot
      ? {
          id: nextSlot.id,
          title: nextSlot.title,
          startTime: nextSlot.startTime,
          endTime: nextSlot.endTime,
          subject: nextSlot.subject?.name ?? null,
        }
      : null,
    openSession: openSession
      ? {
          id: openSession.id,
          subject: openSession.subject,
          taskTitle: openSession.taskTitle,
          plannedMinutes: openSession.plannedMinutes,
          startedAt: openSession.startedAt.toISOString(),
        }
      : null,
    recentSessions: sessions.slice(0, 5).map((s) => ({
      id: s.id,
      subject: s.subject,
      taskTitle: s.taskTitle,
      completed: s.completed,
      actualMinutes: s.actualMinutes,
      startedAt: s.startedAt.toISOString(),
    })),
    weakTopics,
    weakTopicsReported: reportedWeak,
    xpTotal: profile?.xpTotal ?? 0,
    level: profile?.level ?? 1,
    studyGoal: profile?.studyGoal || profile?.primaryGoal || null,
    hasAcademicData:
      subjects.length + pending.length + exams.length + timetable.length + notes.length >
      0,
  };
}

type Facts = Awaited<ReturnType<typeof gatherFacts>>;

function recommendNow(facts: Facts): DraftItem | null {
  if (facts.openSession) {
    return {
      kind: "CONTINUE_SESSION",
      title: facts.openSession.taskTitle || facts.openSession.subject || "Open study session",
      subject: facts.openSession.subject,
      sourceType: "session",
      sourceId: facts.openSession.id,
      minutes: facts.openSession.plannedMinutes,
      fromDatabase: true,
      reason: "You already have an unfinished study session.",
    };
  }
  if (facts.overdue[0]) {
    const a = facts.overdue[0];
    return {
      kind: "DEADLINE",
      title: a.title,
      subject: a.subject,
      sourceType: "assignment",
      sourceId: a.id,
      minutes: 40,
      fromDatabase: true,
      reason: `This assignment is overdue (due ${a.dueDate}).`,
    };
  }
  if (facts.dueSoon[0]) {
    const a = facts.dueSoon[0];
    return {
      kind: "DEADLINE",
      title: a.title,
      subject: a.subject,
      sourceType: "assignment",
      sourceId: a.id,
      minutes: 35,
      fromDatabase: true,
      reason: `Due ${a.dueDate}.`,
    };
  }
  const nearExam = facts.exams.find((e) => e.days <= 5);
  if (nearExam) {
    return {
      kind: "EXAM",
      title: nearExam.title,
      subject: nearExam.subject,
      sourceType: "exam",
      sourceId: nearExam.id,
      minutes: 40,
      fromDatabase: true,
      reason: `Exam on ${nearExam.examDate}.`,
    };
  }
  if (facts.nextSlot) {
    return {
      kind: "TIMETABLE",
      title: facts.nextSlot.title,
      subject: facts.nextSlot.subject,
      sourceType: "timetable",
      sourceId: facts.nextSlot.id,
      minutes: 25,
      fromDatabase: true,
      reason: `On today's timetable at ${facts.nextSlot.startTime}.`,
    };
  }
  if (facts.weakTopics[0]) {
    const topic = facts.weakTopics[0];
    const reported = facts.weakTopicsReported.includes(topic);
    return {
      kind: "WEAK_TOPIC",
      title: topic,
      subject: topic,
      sourceType: reported ? "profile" : "progress",
      sourceId: null,
      minutes: 25,
      fromDatabase: true,
      reason: reported
        ? "You listed this as a weak topic in your profile."
        : "Recent quizzes or grades point to this topic.",
    };
  }
  if (facts.notes[0]) {
    return {
      kind: "REVISION",
      title: facts.notes[0].title,
      subject: facts.notes[0].subject,
      sourceType: "note",
      sourceId: facts.notes[0].id,
      minutes: 20,
      fromDatabase: true,
      reason: "A saved note is ready for a short revision pass.",
    };
  }
  if (facts.subjects[0]) {
    return {
      kind: "REVISION",
      title: facts.subjects[0].name,
      subject: facts.subjects[0].name,
      sourceType: "subject",
      sourceId: facts.subjects[0].id,
      minutes: 25,
      fromDatabase: true,
      reason: "No urgent deadline. Review this subject you already added.",
    };
  }
  return null;
}

function buildPlanItems(facts: Facts): DraftItem[] {
  const items: DraftItem[] = [];
  const seen = new Set<string>();

  function add(item: DraftItem) {
    const key = `${item.sourceType}:${item.sourceId ?? item.title}`;
    if (seen.has(key)) return;
    seen.add(key);
    items.push(item);
  }

  const now = recommendNow(facts);
  if (now) add({ ...now, kind: now.kind === "CONTINUE_SESSION" ? now.kind : "STUDY_NOW" });

  for (const a of facts.dueSoon.slice(0, 3)) {
    add({
      kind: "DEADLINE",
      title: a.title,
      subject: a.subject,
      sourceType: "assignment",
      sourceId: a.id,
      minutes: 30,
      fromDatabase: true,
      reason: `Due ${a.dueDate}.`,
    });
  }
  for (const e of facts.exams.slice(0, 2)) {
    add({
      kind: "EXAM",
      title: e.title,
      subject: e.subject,
      sourceType: "exam",
      sourceId: e.id,
      minutes: 35,
      fromDatabase: true,
      reason: `Exam on ${e.examDate}.`,
    });
  }
  for (const slot of facts.todaySlots.slice(0, 2)) {
    add({
      kind: "TIMETABLE",
      title: slot.title,
      subject: slot.subject,
      sourceType: "timetable",
      sourceId: slot.id,
      minutes: 25,
      fromDatabase: true,
      reason: `Timetable ${slot.startTime}–${slot.endTime}.`,
    });
  }
  for (const topic of facts.weakTopics.slice(0, 2)) {
    add({
      kind: "WEAK_TOPIC",
      title: topic,
      subject: topic,
      sourceType: facts.weakTopicsReported.includes(topic) ? "profile" : "progress",
      sourceId: null,
      minutes: 20,
      fromDatabase: true,
      reason: "From your reported weak topics or recent quiz/grade data.",
    });
  }
  if (facts.notes[0]) {
    add({
      kind: "REVISION",
      title: facts.notes[0].title,
      subject: facts.notes[0].subject,
      sourceType: "note",
      sourceId: facts.notes[0].id,
      minutes: 20,
      fromDatabase: true,
      reason: "Quick revision from a note you saved.",
    });
  }

  return items.slice(0, 8);
}

function headlineFromFacts(facts: Facts, itemCount: number): string {
  if (!facts.hasAcademicData) {
    return "Add a subject, assignment, or exam so Study Buddy can plan from real work.";
  }
  if (facts.overdue.length) {
    return "Start with the overdue assignment, then protect exam time.";
  }
  if (facts.dueSoon.length) {
    return "Clear the nearest deadline, then revise the next exam topic.";
  }
  if (facts.exams.some((e) => e.days <= 5)) {
    return "An exam is close. Prioritize revision over new work.";
  }
  if (itemCount === 0) {
    return "No urgent items today. Add deadlines or notes when you have them.";
  }
  return "A focused plan from your saved subjects, deadlines, and timetable.";
}

function rulesSummary(facts: Facts, lang: string): string {
  const lower = lang.toLowerCase();
  const lines: string[] = [];
  if (facts.overdue[0]) lines.push(`Overdue: ${facts.overdue[0].title}.`);
  if (facts.dueSoon[0]) lines.push(`Next due: ${facts.dueSoon[0].title} (${facts.dueSoon[0].dueDate}).`);
  if (facts.exams[0]) lines.push(`Next exam: ${facts.exams[0].title} on ${facts.exams[0].examDate}.`);
  if (facts.weakTopics[0]) lines.push(`Weak topic on file: ${facts.weakTopics[0]}.`);
  if (!lines.length) {
    lines.push("No urgent deadlines in your data. Study a saved subject or add an assignment.");
  }
  const body = lines.join(" ");
  if (lower.startsWith("hindi") || lower.includes("हिन्दी") || lower.includes("हिंदी")) {
    return `सुझाव (आपके सेव्ड डेटा से): ${body}`;
  }
  if (lower.startsWith("gujarati") || lower.includes("ગુજરાતી")) {
    return `સૂચન (તમારા સેવ્ડ ડેટાથી): ${body}`;
  }
  return `Suggestion from your saved data: ${body}`;
}

function serializePlan(
  plan: {
    id: string;
    planDate: Date;
    headline: string;
    summary: string;
    conversationId: string | null;
    updatedAt: Date;
    items: {
      id: string;
      kind: StudyBuddyItemKind;
      title: string;
      subject: string | null;
      sourceType: string | null;
      sourceId: string | null;
      minutes: number;
      sortOrder: number;
      completed: boolean;
      completedAt: Date | null;
      fromDatabase: boolean;
      reason: string | null;
    }[];
  }
) {
  return {
    id: plan.id,
    planDate: isoDate(plan.planDate),
    headline: plan.headline,
    summary: plan.summary,
    conversationId: plan.conversationId,
    updatedAt: plan.updatedAt.toISOString(),
    items: [...plan.items]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => ({
        id: item.id,
        kind: item.kind,
        title: item.title,
        subject: item.subject,
        sourceType: item.sourceType,
        sourceId: item.sourceId,
        minutes: item.minutes,
        completed: item.completed,
        completedAt: item.completedAt?.toISOString() ?? null,
        fromDatabase: item.fromDatabase,
        reason: item.reason,
      })),
  };
}

async function loadTodayPlan(userId: string, dayKey: string) {
  return prisma.studyBuddyPlan.findUnique({
    where: { userId_planDate: { userId, planDate: startOfTodayUtc(dayKey) } },
    include: { items: true },
  });
}

export async function getStudyBuddyOverview(userId: string) {
  const facts = await gatherFacts(userId);
  const [todayPlan, recentPlans, conversations, streak] = await Promise.all([
    loadTodayPlan(userId, facts.dayKey),
    prisma.studyBuddyPlan.findMany({
      where: { userId },
      orderBy: { planDate: "desc" },
      take: 7,
      include: { items: { orderBy: { sortOrder: "asc" } } },
    }),
    listConversations(userId, undefined, STUDY_BUDDY_SUBJECT),
    prisma.streak.findUnique({
      where: { userId_type: { userId, type: "study" } },
    }),
  ]);

  const studyNow = recommendNow(facts);

  return {
    facts: {
      hasAcademicData: facts.hasAcademicData,
      subjects: facts.subjects,
      pending: facts.pending,
      exams: facts.exams,
      notes: facts.notes,
      todaySlots: facts.todaySlots,
      weakTopics: facts.weakTopics,
      weakTopicsReported: facts.weakTopicsReported,
      explanationLang: facts.explanationLang,
      dailyStudyMinutes: facts.dailyStudyMinutes,
      studyGoal: facts.studyGoal,
    },
    studyNow: studyNow
      ? {
          title: studyNow.title,
          subject: studyNow.subject,
          minutes: studyNow.minutes,
          reason: studyNow.reason,
          fromDatabase: studyNow.fromDatabase,
          kind: studyNow.kind,
          sourceType: studyNow.sourceType,
          sourceId: studyNow.sourceId,
        }
      : null,
    todayPlan: todayPlan ? serializePlan(todayPlan) : null,
    openSession: facts.openSession,
    recentSessions: facts.recentSessions,
    progress: {
      xpTotal: facts.xpTotal,
      level: facts.level,
      streak: streak?.currentCount ?? 0,
    },
    history: recentPlans.map((p) => serializePlan(p)),
    conversations: conversations.map((c) => ({
      id: c.id,
      title: c.title,
      updatedAt: c.updatedAt.toISOString(),
      pinned: c.pinned,
      messageCount: c._count.messages,
    })),
  };
}

async function maybeAiSummary(facts: Facts, items: DraftItem[]): Promise<string> {
  const lang = facts.explanationLang;
  const fallback = rulesSummary(facts, lang);
  const factLines = [
    `Pending assignments: ${facts.pending.map((a) => `${a.title} due ${a.dueDate}`).join("; ") || "none"}`,
    `Upcoming exams: ${facts.exams.map((e) => `${e.title} ${e.examDate}`).join("; ") || "none"}`,
    `Today timetable: ${facts.todaySlots.map((s) => `${s.title} ${s.startTime}`).join("; ") || "none"}`,
    `Weak topics on file: ${facts.weakTopics.join("; ") || "none"}`,
    `Plan items: ${items.map((i) => i.title).join("; ") || "none"}`,
  ].join("\n");

  const { text } = await completeChat({
    system: [
      "You are Study Buddy for StudentLife AI.",
      "Write 2–4 short sentences explaining today's study order.",
      "Use ONLY the FACTS. Never invent subjects, deadlines, exams, notes, or marks.",
      "Label advice as a suggestion. Keep it actionable.",
      explanationLanguageRule(lang),
    ].join(" "),
    user: `FACTS:\n${factLines}`,
    maxTokens: 280,
  });
  return text || fallback;
}

export async function generateStudyBuddyPlan(userId: string) {
  const facts = await gatherFacts(userId);
  const items = buildPlanItems(facts);
  const headline = headlineFromFacts(facts, items.length);
  const summary = await maybeAiSummary(facts, items);
  const planDate = facts.today;
  const factsJson = {
    pending: facts.pending,
    exams: facts.exams,
    todaySlots: facts.todaySlots,
    weakTopics: facts.weakTopics,
    subjects: facts.subjects.map((s) => s.name),
  } as Prisma.InputJsonValue;

  const existing = await prisma.studyBuddyPlan.findUnique({
    where: { userId_planDate: { userId, planDate } },
    include: { items: true },
  });

  const completedKeys = new Set(
    (existing?.items ?? [])
      .filter((item) => item.completed)
      .map((item) => `${item.sourceType}:${item.sourceId ?? item.title}`)
  );

  const plan = await prisma.$transaction(async (tx) => {
    const row = existing
      ? await tx.studyBuddyPlan.update({
          where: { id: existing.id },
          data: { headline, summary, factsJson },
        })
      : await tx.studyBuddyPlan.create({
          data: { userId, planDate, headline, summary, factsJson },
        });

    await tx.studyBuddyPlanItem.deleteMany({
      where: { planId: row.id, completed: false },
    });

    const toCreate = items.filter(
      (item) => !completedKeys.has(`${item.sourceType}:${item.sourceId ?? item.title}`)
    );

    if (toCreate.length) {
      await tx.studyBuddyPlanItem.createMany({
        data: toCreate.map((item, index) => ({
          planId: row.id,
          kind: item.kind,
          title: item.title,
          subject: item.subject,
          sourceType: item.sourceType,
          sourceId: item.sourceId,
          minutes: item.minutes,
          sortOrder: index,
          fromDatabase: item.fromDatabase,
          reason: item.reason,
        })),
      });
    }

    return tx.studyBuddyPlan.findUniqueOrThrow({
      where: { id: row.id },
      include: { items: true },
    });
  }, {
    maxWait: 10_000,
    timeout: 20_000,
  });

  return serializePlan(plan);
}

export async function completeStudyBuddyItem(userId: string, itemId: string) {
  const item = await prisma.studyBuddyPlanItem.findFirst({
    where: { id: itemId, plan: { userId } },
    include: { plan: { select: { userId: true } } },
  });
  if (!item) throw new Error("NOT_FOUND");
  if (item.completed) {
    return { item: { id: item.id, completed: true }, xp: null, already: true };
  }

  const updated = await prisma.studyBuddyPlanItem.updateMany({
    where: { id: itemId, completed: false, plan: { userId } },
    data: { completed: true, completedAt: new Date() },
  });
  if (updated.count === 0) {
    return { item: { id: item.id, completed: true }, xp: null, already: true };
  }

  const xp = await awardXp(
    userId,
    10,
    `item:${itemId}`,
    "study_buddy"
  );
  await recordMeaningfulActivity(userId, "task");
  const current = await prisma.studyBuddyPlanItem.findFirst({
    where: { id: itemId, plan: { userId } },
  });
  return {
    item: {
      id: current?.id ?? itemId,
      completed: true,
      completedAt: current?.completedAt?.toISOString() ?? new Date().toISOString(),
    },
    xp,
    already: false,
  };
}

export async function startBuddySession(
  userId: string,
  opts: { plannedMinutes?: number; quick?: boolean }
) {
  const facts = await gatherFacts(userId);
  if (facts.openSession) {
    return { session: facts.openSession, created: false };
  }
  const rec = recommendNow(facts);
  const minutes = opts.plannedMinutes ?? (opts.quick ? 20 : 25);
  const subject = rec?.subject || facts.subjects[0]?.name || undefined;
  const taskTitle = opts.quick
    ? rec
      ? `Quick revision: ${rec.title}`
      : "Quick revision"
    : rec?.title || "Study Buddy session";
  const session = await startStudySession(userId, {
    subject,
    taskTitle,
    plannedMinutes: minutes,
  });
  return {
    session: {
      id: session.id,
      subject: session.subject,
      taskTitle: session.taskTitle,
      plannedMinutes: session.plannedMinutes,
      startedAt: session.startedAt.toISOString(),
    },
    created: true,
  };
}

export async function continueBuddySession(userId: string, complete = false) {
  const facts = await gatherFacts(userId);
  if (!facts.openSession) return { session: null, xp: null };
  if (!complete) return { session: facts.openSession, xp: null };
  const result = await completeStudySession(userId, facts.openSession.id);
  return {
    session: result.session
      ? {
          id: result.session.id,
          completed: result.session.completed,
          actualMinutes: result.session.actualMinutes,
        }
      : null,
    xp: result.xp,
    meaningful: "meaningful" in result ? result.meaningful : Boolean(result.xp),
  };
}

function factsBlock(facts: Facts): string {
  return [
    `Preferred explanation language: ${facts.explanationLang}`,
    explanationLanguageRule(facts.explanationLang),
    `Subjects (database): ${facts.subjects.map((s) => s.name).join(", ") || "none"}`,
    `Pending assignments (database): ${
      facts.pending
        .map((a) => `${a.title}${a.subject ? ` (${a.subject})` : ""} due ${a.dueDate}`)
        .join("; ") || "none"
    }`,
    `Upcoming exams (database): ${
      facts.exams.map((e) => `${e.title} — ${e.subject} on ${e.examDate}`).join("; ") ||
      "none"
    }`,
    `Today timetable (database): ${
      facts.todaySlots
        .map((s) => `${s.title} ${s.startTime}–${s.endTime}`)
        .join("; ") || "none"
    }`,
    `Notes on file (titles only): ${facts.notes.map((n) => n.title).join("; ") || "none"}`,
    `Weak topics on file: ${facts.weakTopics.join("; ") || "none"}`,
    `Open session: ${
      facts.openSession
        ? `${facts.openSession.taskTitle || facts.openSession.subject} (${facts.openSession.plannedMinutes} min)`
        : "none"
    }`,
    "Never invent subjects, marks, deadlines, exams, notes, or progress that are not listed as database facts.",
    "If data is missing, say so and tell the student which StudentLife page to update.",
    "Clearly mark suggestions as suggestions, not facts.",
  ].join("\n");
}

function rulesChat(message: string, facts: Facts): string {
  const rec = recommendNow(facts);
  const lang = facts.explanationLang.toLowerCase();
  const factLine = rec
    ? `FACT: ${rec.title}${rec.subject ? ` · ${rec.subject}` : ""} — ${rec.reason}`
    : "FACT: No subjects, assignments, exams, notes, or timetable rows are saved yet.";
  const suggestion = rec
    ? `SUGGESTION: Study this next for about ${rec.minutes} minutes.`
    : "SUGGESTION: Add a subject or assignment, then ask again.";
  if (lang.startsWith("hindi") || lang.includes("हिन्दी") || lang.includes("हिंदी")) {
    return [`आपका सवाल: ${message}`, factLine, suggestion].join("\n");
  }
  if (lang.startsWith("gujarati") || lang.includes("ગુજરાતી")) {
    return [`તમારો પ્રશ્ન: ${message}`, factLine, suggestion].join("\n");
  }
  return [`Your question: ${message}`, factLine, suggestion].join("\n");
}

export async function askStudyBuddy(
  userId: string,
  message: string,
  conversationId?: string
) {
  const facts = await gatherFacts(userId);
  let id = conversationId;
  if (id) {
    const existing = await getConversation(userId, id);
    if (!existing || existing.subject !== STUDY_BUDDY_SUBJECT) {
      throw new Error("NOT_FOUND");
    }
  } else {
    const created = await createConversation(
      userId,
      message.slice(0, 60),
      STUDY_BUDDY_SUBJECT
    );
    id = created.id;
  }

  const existing = await getConversation(userId, id);
  const history = (existing?.messages ?? [])
    .slice(-8)
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  await appendMessage(userId, id, "USER", message);

  const { text, provider } = await completeChat({
    system: [
      "You are Study Buddy, a personal academic companion in StudentLife AI.",
      "Help the student decide what to study using only the FACTS block.",
      "Short, actionable replies. No fake syllabus, marks, or deadlines.",
      factsBlock(facts),
      history ? `Recent conversation:\n${history}` : "",
    ].join("\n"),
    user: message,
    maxTokens: 700,
  });

  const reply = text || rulesChat(message, facts);
  await appendMessage(userId, id, "ASSISTANT", reply, provider);

  return { reply, provider, conversationId: id };
}

export async function saveStudyBuddyChat(userId: string, conversationId: string) {
  const convo = await getConversation(userId, conversationId);
  if (!convo || convo.subject !== STUDY_BUDDY_SUBJECT) {
    throw new Error("NOT_FOUND");
  }
  await pinConversation(userId, conversationId, true);
  return { id: conversationId, pinned: true };
}

export async function getStudyBuddyConversation(userId: string, id: string) {
  const convo = await getConversation(userId, id);
  if (!convo || convo.subject !== STUDY_BUDDY_SUBJECT) return null;
  return {
    id: convo.id,
    title: convo.title,
    messages: convo.messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
    })),
  };
}
