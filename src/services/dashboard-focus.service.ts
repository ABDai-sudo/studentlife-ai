import { prisma } from "@/lib/db";

export type DashboardFocusItem = {
  id: string;
  title: string;
  date: string;
  subject: string | null;
  kind: "assignment" | "exam";
};

export type DashboardFocus = {
  nextDeadline: DashboardFocusItem | null;
};

function toDay(value: Date): string {
  return value.toISOString().slice(0, 10);
}

/**
 * Next real assignment or exam for the signed-in user.
 * Titles only — never grades, money, or other students' records.
 */
export async function getDashboardFocus(
  userId: string
): Promise<DashboardFocus> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [assignment, exam] = await Promise.all([
    prisma.assignment.findFirst({
      where: {
        userId,
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
      orderBy: { dueDate: "asc" },
      select: { id: true, title: true, dueDate: true, subject: true },
    }),
    prisma.exam.findFirst({
      where: { userId, examDate: { gte: startOfToday } },
      orderBy: { examDate: "asc" },
      select: { id: true, title: true, examDate: true, subject: true },
    }),
  ]);

  const assignmentItem: DashboardFocusItem | null = assignment
    ? {
        id: assignment.id,
        title: assignment.title,
        date: toDay(assignment.dueDate),
        subject: assignment.subject,
        kind: "assignment",
      }
    : null;
  const examItem: DashboardFocusItem | null = exam
    ? {
        id: exam.id,
        title: exam.title,
        date: toDay(exam.examDate),
        subject: exam.subject,
        kind: "exam",
      }
    : null;

  if (!assignmentItem) return { nextDeadline: examItem };
  if (!examItem) return { nextDeadline: assignmentItem };
  return {
    nextDeadline:
      assignmentItem.date <= examItem.date ? assignmentItem : examItem,
  };
}
