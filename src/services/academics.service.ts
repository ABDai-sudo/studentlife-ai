import { prisma } from "@/lib/db";
import { parseDateOnly } from "@/lib/money";
import type {
  CreateAssignmentInput,
  CreateAttendanceInput,
  CreateCgpaInput,
  CreateExamInput,
  CreateNoteInput,
  CreateSubjectInput,
  CreateTimetableInput,
  UpdateAssignmentInput,
} from "@/lib/validations/academics";

export async function listSubjects(userId: string) {
  return prisma.subject.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });
}

export async function createSubject(userId: string, input: CreateSubjectInput) {
  return prisma.subject.create({
    data: {
      userId,
      name: input.name.trim(),
      code: input.code || null,
      instructor: input.instructor || null,
      credits: input.credits ?? null,
    },
  });
}

export async function deleteSubject(userId: string, id: string) {
  const row = await prisma.subject.findFirst({ where: { id, userId } });
  if (!row) return false;
  await prisma.subject.delete({ where: { id } });
  return true;
}

export async function listNotes(userId: string) {
  return prisma.note.findMany({
    where: { userId },
    include: { subject: { select: { id: true, name: true } } },
    orderBy: { updatedAt: "desc" },
  });
}

export async function createNote(userId: string, input: CreateNoteInput) {
  if (input.subjectId) {
    const subject = await prisma.subject.findFirst({
      where: { id: input.subjectId, userId },
    });
    if (!subject) throw new Error("SUBJECT_NOT_FOUND");
  }
  return prisma.note.create({
    data: {
      userId,
      title: input.title.trim(),
      content: input.content.trim(),
      subjectId: input.subjectId || null,
    },
    include: { subject: { select: { id: true, name: true } } },
  });
}

export async function deleteNote(userId: string, id: string) {
  const row = await prisma.note.findFirst({ where: { id, userId } });
  if (!row) return false;
  await prisma.note.delete({ where: { id } });
  return true;
}

export async function listAssignments(userId: string) {
  return prisma.assignment.findMany({
    where: { userId },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });
}

export async function createAssignment(
  userId: string,
  input: CreateAssignmentInput
) {
  return prisma.assignment.create({
    data: {
      userId,
      title: input.title.trim(),
      subject: input.subject || null,
      description: input.description || null,
      dueDate: parseDateOnly(input.dueDate)!,
      priority: input.priority,
      status: input.status,
    },
  });
}

export async function updateAssignment(
  userId: string,
  id: string,
  input: UpdateAssignmentInput
) {
  const existing = await prisma.assignment.findFirst({ where: { id, userId } });
  if (!existing) return null;
  return prisma.assignment.update({
    where: { id },
    data: {
      ...(input.title ? { title: input.title.trim() } : {}),
      ...(input.subject !== undefined ? { subject: input.subject } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.dueDate
        ? { dueDate: parseDateOnly(input.dueDate) ?? existing.dueDate }
        : {}),
      ...(input.priority != null ? { priority: input.priority } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.grade !== undefined ? { grade: input.grade } : {}),
    },
  });
}

export async function deleteAssignment(userId: string, id: string) {
  const row = await prisma.assignment.findFirst({ where: { id, userId } });
  if (!row) return false;
  await prisma.assignment.delete({ where: { id } });
  return true;
}

export async function listExams(userId: string) {
  return prisma.exam.findMany({
    where: { userId },
    orderBy: { examDate: "asc" },
  });
}

export async function createExam(userId: string, input: CreateExamInput) {
  return prisma.exam.create({
    data: {
      userId,
      title: input.title.trim(),
      subject: input.subject.trim(),
      examType: input.examType,
      examDate: parseDateOnly(input.examDate)!,
      location: input.location || null,
      notes: input.notes || null,
    },
  });
}

export async function deleteExam(userId: string, id: string) {
  const row = await prisma.exam.findFirst({ where: { id, userId } });
  if (!row) return false;
  await prisma.exam.delete({ where: { id } });
  return true;
}

export async function listTimetable(userId: string) {
  return prisma.timetableSlot.findMany({
    where: { userId },
    include: { subject: { select: { id: true, name: true } } },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
}

export async function createTimetableSlot(
  userId: string,
  input: CreateTimetableInput
) {
  if (input.subjectId) {
    const subject = await prisma.subject.findFirst({
      where: { id: input.subjectId, userId },
    });
    if (!subject) throw new Error("SUBJECT_NOT_FOUND");
  }
  return prisma.timetableSlot.create({
    data: {
      userId,
      title: input.title.trim(),
      subjectId: input.subjectId || null,
      dayOfWeek: input.dayOfWeek,
      startTime: input.startTime,
      endTime: input.endTime,
      location: input.location || null,
    },
    include: { subject: { select: { id: true, name: true } } },
  });
}

export async function deleteTimetableSlot(userId: string, id: string) {
  const row = await prisma.timetableSlot.findFirst({ where: { id, userId } });
  if (!row) return false;
  await prisma.timetableSlot.delete({ where: { id } });
  return true;
}

export async function listAttendance(userId: string) {
  return prisma.attendanceRecord.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 100,
  });
}

export async function upsertAttendance(
  userId: string,
  input: CreateAttendanceInput
) {
  const date = parseDateOnly(input.date)!;
  return prisma.attendanceRecord.upsert({
    where: {
      userId_subject_date: {
        userId,
        subject: input.subject.trim(),
        date,
      },
    },
    create: {
      userId,
      subject: input.subject.trim(),
      date,
      status: input.status,
      notes: input.notes || null,
    },
    update: {
      status: input.status,
      notes: input.notes || null,
    },
  });
}

export async function listCgpa(userId: string) {
  return prisma.cgpaRecord.findMany({
    where: { userId },
    orderBy: [{ semester: "desc" }, { subject: "asc" }],
  });
}

export async function createCgpa(userId: string, input: CreateCgpaInput) {
  return prisma.cgpaRecord.create({
    data: {
      userId,
      semester: input.semester,
      subject: input.subject.trim(),
      credits: input.credits,
      grade: input.grade.trim(),
      gradePoint: input.gradePoint,
    },
  });
}

export async function deleteCgpa(userId: string, id: string) {
  const row = await prisma.cgpaRecord.findFirst({ where: { id, userId } });
  if (!row) return false;
  await prisma.cgpaRecord.delete({ where: { id } });
  return true;
}

export async function getAcademicProgress(userId: string) {
  const [subjects, assignments, exams, attendance, cgpa, notes, timetable] =
    await Promise.all([
      prisma.subject.count({ where: { userId } }),
      prisma.assignment.findMany({
        where: { userId },
        select: { status: true, dueDate: true },
      }),
      prisma.exam.findMany({
        where: { userId, examDate: { gte: new Date() } },
        orderBy: { examDate: "asc" },
        take: 5,
      }),
      prisma.attendanceRecord.findMany({ where: { userId } }),
      prisma.cgpaRecord.findMany({ where: { userId } }),
      prisma.note.count({ where: { userId } }),
      prisma.timetableSlot.count({ where: { userId } }),
    ]);

  const present = attendance.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
  const attendanceRate =
    attendance.length === 0
      ? null
      : Math.round((present / attendance.length) * 100);

  const totalCredits = cgpa.reduce((s, r) => s + r.credits, 0);
  const weighted = cgpa.reduce((s, r) => s + r.credits * r.gradePoint, 0);
  const cgpaValue =
    totalCredits > 0 ? Math.round((weighted / totalCredits) * 100) / 100 : null;

  const pendingAssignments = assignments.filter(
    (a) => a.status === "PENDING" || a.status === "IN_PROGRESS" || a.status === "OVERDUE"
  ).length;

  return {
    subjects,
    notes,
    timetableSlots: timetable,
    pendingAssignments,
    upcomingExams: exams.map((e) => ({
      id: e.id,
      title: e.title,
      subject: e.subject,
      examDate: e.examDate.toISOString().slice(0, 10),
      examType: e.examType,
    })),
    attendanceRate,
    attendanceCount: attendance.length,
    cgpa: cgpaValue,
    cgpaEntries: cgpa.length,
  };
}
