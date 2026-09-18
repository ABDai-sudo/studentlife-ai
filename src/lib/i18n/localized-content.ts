import type { MessageKey } from "@/lib/i18n/dictionaries/en";

type TFn = (key: MessageKey, params?: Record<string, string | number>) => string;

export function localizedQuestTitle(
  quest: { code?: string | null; title: string },
  t: TFn
): string {
  const code = quest.code || "";
  if (code === "study_block") {
    const subject =
      quest.title.replace(/^Study\s+/i, "").replace(/\s+for 25 minutes$/i, "") ||
      "";
    return t("quest.studyBlock", { subject });
  }
  if (code === "notes_review") return t("quest.notesReview");
  if (code === "quiz_five") return t("quest.quizFive");
  if (code === "assignment_push") {
    const named = quest.title.match(/^Make progress on [“"](.+)[”"]$/);
    if (named?.[1]) return t("quest.assignmentNamed", { title: named[1] });
    return t("quest.assignmentGeneric");
  }
  if (code === "five_sessions") return t("quest.fiveSessions");
  if (code === "three_quizzes") return t("quest.threeQuizzes");
  if (code === "high_priority_tasks") return t("quest.highPriority");
  return quest.title;
}

export function localizedLevelName(level: number, t: TFn): string {
  const key = `level.${level}` as MessageKey;
  return t(key);
}

export function localizedBuddyReason(reason: string | null | undefined, t: TFn): string {
  if (!reason) return "";
  const exam = reason.match(/^Exam on (.+)\.$/);
  if (exam) return t("buddy.reason.examOn", { date: exam[1] });
  const due = reason.match(/^Due (.+)\.$/);
  if (due) return t("buddy.reason.due", { date: due[1] });
  const overdue = reason.match(/^This assignment is overdue \(due (.+)\)\.$/);
  if (overdue) return t("buddy.reason.overdue", { date: overdue[1] });
  const slot = reason.match(/^On today's timetable at (.+)\.$/);
  if (slot) return t("buddy.reason.timetable", { time: slot[1] });
  const range = reason.match(/^Timetable (.+)\.$/);
  if (range) return t("buddy.reason.timetableRange", { range: range[1] });
  if (reason.includes("unfinished study session")) return t("buddy.reason.openSession");
  if (reason.includes("No urgent deadline")) return t("buddy.reason.noUrgent");
  if (reason.includes("listed this as a weak topic")) return t("buddy.reason.weakListed");
  if (reason.includes("quizzes or grades")) return t("buddy.reason.weakQuiz");
  if (reason.includes("saved note is ready")) return t("buddy.reason.note");
  if (reason.includes("Quick revision from a note")) return t("buddy.reason.noteQuick");
  if (reason.includes("reported weak topics")) return t("buddy.reason.weakFile");
  return reason;
}
