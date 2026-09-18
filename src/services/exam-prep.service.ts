import { listAssignments, listExams } from "@/services/academics.service";
import { getStudyBuddyOverview } from "@/services/study-buddy.service";

export type ExamPrepWorkflow = {
  nextExam: {
    id: string;
    title: string;
    subject: string;
    examDate: string;
    daysLeft: number;
    examType: string;
  } | null;
  upcoming: {
    id: string;
    title: string;
    subject: string;
    examDate: string;
    daysLeft: number;
  }[];
  studyNow: {
    title: string;
    subject: string | null;
    minutes: number;
    reason: string;
  } | null;
  relatedTasks: { id: string; title: string; dueDate: string }[];
  emergencyRecommended: boolean;
};

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysUntil(date: Date, today: Date): number {
  const a = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const b = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.round((a - b) / 86_400_000);
}

export async function getExamPrepWorkflow(
  userId: string
): Promise<ExamPrepWorkflow> {
  const [exams, assignments, overview] = await Promise.all([
    listExams(userId),
    listAssignments(userId),
    getStudyBuddyOverview(userId),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = exams
    .filter((e) => e.examDate.getTime() >= today.getTime() - 86_400_000)
    .sort((a, b) => a.examDate.getTime() - b.examDate.getTime())
    .map((e) => ({
      id: e.id,
      title: e.title,
      subject: e.subject,
      examDate: isoDate(e.examDate),
      daysLeft: Math.max(0, daysUntil(e.examDate, today)),
      examType: e.examType,
    }));

  const nextExam = upcoming[0]
    ? {
        id: upcoming[0].id,
        title: upcoming[0].title,
        subject: upcoming[0].subject,
        examDate: upcoming[0].examDate,
        daysLeft: upcoming[0].daysLeft,
        examType: upcoming[0].examType,
      }
    : null;

  const relatedTasks = assignments
    .filter((a) => {
      const open =
        a.status === "PENDING" ||
        a.status === "IN_PROGRESS" ||
        a.status === "OVERDUE";
      if (!open || !nextExam) return false;
      return (
        (a.subject &&
          a.subject.toLowerCase() === nextExam.subject.toLowerCase()) ||
        a.title.toLowerCase().includes(nextExam.subject.toLowerCase())
      );
    })
    .slice(0, 4)
    .map((a) => ({
      id: a.id,
      title: a.title,
      dueDate: isoDate(a.dueDate),
    }));

  return {
    nextExam,
    upcoming: upcoming.slice(0, 4).map((row) => ({
      id: row.id,
      title: row.title,
      subject: row.subject,
      examDate: row.examDate,
      daysLeft: row.daysLeft,
    })),
    studyNow: overview.studyNow
      ? {
          title: overview.studyNow.title,
          subject: overview.studyNow.subject,
          minutes: overview.studyNow.minutes,
          reason: overview.studyNow.reason,
        }
      : null,
    relatedTasks,
    emergencyRecommended: nextExam != null && nextExam.daysLeft <= 3,
  };
}
