import {
  listAssignments,
  listExams,
  createTimetableSlot,
} from "@/services/academics.service";
import { prisma } from "@/lib/db";

export type EmergencyPlan = {
  headline: string;
  now: { title: string; detail: string; minutes: number }[];
  next: { title: string; detail: string; minutes: number }[];
  later: { title: string; detail: string; minutes: number }[];
  breaks: string[];
  sleepReminder: string;
  addedSlots?: number;
};

export async function buildEmergencyPlan(
  userId: string,
  opts: {
    availableHours?: number;
    sleepHours?: number;
    addToTimetable?: boolean;
  }
): Promise<EmergencyPlan> {
  const availableHours = opts.availableHours ?? 8;
  const sleepHours = opts.sleepHours ?? 7;
  const usableMinutes = Math.max(
    60,
    Math.floor((availableHours - Math.min(1.5, sleepHours * 0.15)) * 60)
  );

  const [assignments, exams] = await Promise.all([
    listAssignments(userId),
    listExams(userId),
  ]);

  const pending = assignments
    .filter((a) => a.status === "PENDING" || a.status === "IN_PROGRESS")
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .slice(0, 8);

  const upcoming = exams
    .filter((e) => e.examDate.getTime() >= Date.now() - 86400000)
    .sort((a, b) => a.examDate.getTime() - b.examDate.getTime())
    .slice(0, 6);

  const now: EmergencyPlan["now"] = [];
  const next: EmergencyPlan["next"] = [];
  const later: EmergencyPlan["later"] = [];

  let remaining = usableMinutes;

  for (const a of pending.slice(0, 2)) {
    const minutes = Math.min(45, remaining);
    if (minutes < 20) break;
    now.push({
      title: `Start: ${a.title}`,
      detail: `Due ${a.dueDate.toISOString().slice(0, 10)}${a.subject ? ` · ${a.subject}` : ""}. Outline → draft → check.`,
      minutes,
    });
    remaining -= minutes;
  }

  if (now.length === 0 && upcoming[0]) {
    now.push({
      title: `Revise: ${upcoming[0].subject}`,
      detail: `Exam “${upcoming[0].title}” on ${upcoming[0].examDate.toISOString().slice(0, 10)}. Skim weak chapters first.`,
      minutes: Math.min(50, remaining),
    });
    remaining -= Math.min(50, remaining);
  }

  if (now.length === 0) {
    now.push({
      title: "Stabilize",
      detail:
        "No urgent deadlines found. List top 3 topics, study 40 minutes, then plan tomorrow.",
      minutes: 40,
    });
    remaining -= 40;
  }

  for (const a of pending.slice(2, 4)) {
    if (remaining < 25) break;
    const minutes = Math.min(40, remaining);
    next.push({
      title: a.title,
      detail: "Continue after a short break. Aim for a submit-ready draft.",
      minutes,
    });
    remaining -= minutes;
  }

  for (const e of upcoming.slice(0, 3)) {
    if (remaining < 25) break;
    const minutes = Math.min(45, remaining);
    next.push({
      title: `Exam prep: ${e.subject}`,
      detail: `${e.title} · practice questions + quick notes.`,
      minutes,
    });
    remaining -= minutes;
  }

  later.push({
    title: "Light revision + packing",
    detail: "Flashcards, formula sheet, or rearrange tomorrow’s timetable.",
    minutes: Math.min(30, Math.max(15, remaining)),
  });

  const headline =
    pending.length + upcoming.length === 0
      ? "No urgent deadlines yet. Start with a focused 40-minute study block."
      : pending.length >= 3
        ? "Several items are due. Complete these two tasks first."
        : "Clear the nearest deadline, then protect exam revision.";

  let addedSlots = 0;
  if (opts.addToTimetable) {
    const day = new Date().getDay();
    const blocks = [...now, ...next].slice(0, 4);
    let hour = 16;
    for (const block of blocks) {
      const start = `${String(hour).padStart(2, "0")}:00`;
      const endHour = hour + Math.max(1, Math.round(block.minutes / 60));
      const end = `${String(Math.min(endHour, 23)).padStart(2, "0")}:00`;
      const title = block.title.slice(0, 120);
      const already = await prisma.timetableSlot.findFirst({
        where: {
          userId,
          dayOfWeek: day,
          startTime: start,
          title,
          location: "Emergency plan",
        },
        select: { id: true },
      });
      if (!already) {
        await createTimetableSlot(userId, {
          title,
          subjectId: null,
          dayOfWeek: day,
          startTime: start,
          endTime: end,
          location: "Emergency plan",
        });
        addedSlots += 1;
      }
      hour = Math.min(22, endHour + 1);
    }
  }

  return {
    headline,
    now,
    next,
    later,
    breaks: [
      "5–10 minute break after every focused block",
      "Drink water and stretch — do not skip meals",
    ],
    sleepReminder: `Protect about ${sleepHours} hours of sleep. Impossible all-nighters are excluded from this plan.`,
    addedSlots: opts.addToTimetable ? addedSlots : undefined,
  };
}
