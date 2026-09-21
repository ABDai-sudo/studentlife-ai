import { generateStudyBuddyPlan } from "@/services/study-buddy.service";
import { enqueueInAppNotification } from "@/services/notification.service";
import { recordMeaningfulActivity } from "@/services/gamification.service";

export async function syncAfterAssignmentChange(
  userId: string,
  assignment: { id: string; title: string; dueDate: Date }
) {
  const due = assignment.dueDate.toISOString().slice(0, 10);
  await enqueueInAppNotification({
    userId,
    category: "ASSIGNMENT_DEADLINE",
    title: "Assignment saved",
    body: `${assignment.title} is due ${due}. Study Buddy will keep it in tonight's priorities.`,
    href: "/dashboard/study-buddy",
    idempotencyKey: `assignment:${assignment.id}:created`,
  });
  try {
    await generateStudyBuddyPlan(userId);
  } catch {
    // plan refresh is best-effort
  }
  try {
    await recordMeaningfulActivity(userId, "task");
  } catch {
    // streak/xp side-effects should not block saves
  }
}

export async function syncAfterExamChange(
  userId: string,
  exam: { id: string; title: string; examDate: Date }
) {
  const when = exam.examDate.toISOString().slice(0, 10);
  await enqueueInAppNotification({
    userId,
    category: "UPCOMING_EXAM",
    title: "Exam saved",
    body: `${exam.title} is on ${when}. Countdown and Study Buddy priorities will update.`,
    href: "/dashboard/study-buddy",
    idempotencyKey: `exam:${exam.id}:created`,
  });
  try {
    await generateStudyBuddyPlan(userId);
  } catch {
    // ignore
  }
}
