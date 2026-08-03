import { z } from "zod";

export const createSubjectSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    code: z.string().trim().max(20).optional().or(z.literal("")),
    instructor: z.string().trim().max(100).optional().or(z.literal("")),
    credits: z.coerce.number().min(0).max(20).optional().nullable(),
  })
  .strict();

export const createNoteSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    content: z.string().trim().min(1).max(20000),
    subjectId: z.string().cuid().optional().nullable(),
  })
  .strict();

export const createAssignmentSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    subject: z.string().trim().max(100).optional().or(z.literal("")),
    description: z.string().trim().max(2000).optional().or(z.literal("")),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    priority: z.coerce.number().int().min(1).max(3).default(2),
    status: z
      .enum(["PENDING", "IN_PROGRESS", "SUBMITTED", "GRADED", "OVERDUE"])
      .default("PENDING"),
  })
  .strict();

export const updateAssignmentSchema = z
  .object({
    title: z.string().trim().min(1).max(160).optional(),
    subject: z.string().trim().max(100).optional().nullable(),
    description: z.string().trim().max(2000).optional().nullable(),
    dueDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    priority: z.coerce.number().int().min(1).max(3).optional(),
    status: z
      .enum(["PENDING", "IN_PROGRESS", "SUBMITTED", "GRADED", "OVERDUE"])
      .optional(),
    grade: z.string().trim().max(20).optional().nullable(),
  })
  .strict();

export const createExamSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    subject: z.string().trim().min(1).max(100),
    examType: z
      .enum(["QUIZ", "MIDTERM", "FINAL", "PRACTICAL", "OTHER"])
      .default("MIDTERM"),
    examDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    location: z.string().trim().max(120).optional().or(z.literal("")),
    notes: z.string().trim().max(2000).optional().or(z.literal("")),
  })
  .strict();

export const createTimetableSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    subjectId: z.string().cuid().optional().nullable(),
    dayOfWeek: z.coerce.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    location: z.string().trim().max(120).optional().or(z.literal("")),
  })
  .strict();

export const createAttendanceSchema = z
  .object({
    subject: z.string().trim().min(1).max(100),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]).default("PRESENT"),
    notes: z.string().trim().max(500).optional().or(z.literal("")),
  })
  .strict();

export const createCgpaSchema = z
  .object({
    semester: z.coerce.number().int().min(1).max(20),
    subject: z.string().trim().min(1).max(100),
    credits: z.coerce.number().positive().max(20),
    grade: z.string().trim().min(1).max(10),
    gradePoint: z.coerce.number().min(0).max(10),
  })
  .strict();

export const aiTutorSchema = z
  .object({
    message: z.string().trim().min(1).max(2000),
    subject: z.string().trim().max(100).optional(),
  })
  .strict();

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
export type CreateExamInput = z.infer<typeof createExamSchema>;
export type CreateTimetableInput = z.infer<typeof createTimetableSchema>;
export type CreateAttendanceInput = z.infer<typeof createAttendanceSchema>;
export type CreateCgpaInput = z.infer<typeof createCgpaSchema>;
export type AiTutorInput = z.infer<typeof aiTutorSchema>;
