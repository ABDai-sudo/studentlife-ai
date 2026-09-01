import { z } from "zod";

export const aiTutorSchema = z
  .object({
    message: z.string().trim().min(1).max(4000),
    subject: z.string().trim().max(100).optional(),
    conversationId: z.string().cuid().optional(),
    mode: z
      .enum([
        "default",
        "explain_simply",
        "explain_detail",
        "exam_ready",
        "example",
        "diagram",
        "notes",
        "test_me",
        "flashcards",
        "translate",
        "continue",
      ])
      .optional(),
    stream: z.boolean().optional(),
  })
  .strict();

export const createConversationSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    subject: z.string().trim().max(100).optional(),
  })
  .strict();

export const renameConversationSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
  })
  .strict();

export const messageFeedbackSchema = z
  .object({
    feedback: z.union([z.literal(1), z.literal(-1), z.null()]),
  })
  .strict();

export const assignmentHelperSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    question: z.string().trim().min(1).max(8000),
    institution: z.string().trim().max(200).optional(),
    course: z.string().trim().max(200).optional(),
    semester: z.string().trim().max(80).optional(),
    subject: z.string().trim().max(120).optional(),
    marks: z.coerce.number().int().min(1).max(100).optional(),
    wordLimit: z.coerce.number().int().min(50).max(10000).optional(),
    dueDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    format: z.string().trim().max(120).optional(),
    instructions: z.string().trim().max(4000).optional(),
    citationStyle: z.string().trim().max(80).optional(),
    language: z.string().trim().max(80).optional(),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    mode: z
      .enum([
        "OUTLINE",
        "GUIDED_DRAFT",
        "FULL_DRAFT",
        "EXAM_STYLE",
        "PRESENTATION",
        "VIVA_PREP",
      ])
      .default("GUIDED_DRAFT"),
    assignmentId: z.string().cuid().optional(),
  })
  .strict();

export const questionPaperSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    institution: z.string().trim().max(200).optional(),
    course: z.string().trim().max(200).optional(),
    semester: z.string().trim().max(80).optional(),
    subject: z.string().trim().min(1).max(120),
    unit: z.string().trim().max(120).optional(),
    chapter: z.string().trim().max(120).optional(),
    topics: z.string().trim().max(4000).optional(),
    mode: z
      .enum([
        "QUICK_PRACTICE",
        "CLASS_TEST",
        "INTERNAL_EXAM",
        "SEMESTER_MOCK",
        "CHAPTER_TEST",
        "VIVA_PRACTICE",
        "PRACTICAL_EXAM",
        "REVISION_QUIZ",
      ])
      .default("QUICK_PRACTICE"),
    difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
    questionCount: z.coerce.number().int().min(3).max(40).default(10),
    types: z
      .array(
        z.enum([
          "MCQ",
          "TRUE_FALSE",
          "FILL_BLANK",
          "ONE_WORD",
          "VERY_SHORT",
          "SHORT",
          "LONG",
          "CODING",
          "NUMERICAL",
          "PRACTICAL",
          "VIVA",
          "CASE_STUDY",
        ])
      )
      .min(1)
      .default(["MCQ", "SHORT"]),
    durationMinutes: z.coerce.number().int().min(10).max(300).optional(),
    totalMarks: z.coerce.number().int().min(5).max(200).optional(),
    includeAnswers: z.boolean().default(true),
  })
  .strict();

export const updateQuestionSchema = z
  .object({
    prompt: z.string().trim().min(1).max(4000).optional(),
    answer: z.string().trim().max(4000).optional().nullable(),
    explanation: z.string().trim().max(4000).optional().nullable(),
    marks: z.coerce.number().int().min(1).max(50).optional(),
    orderIndex: z.coerce.number().int().min(0).max(200).optional(),
  })
  .strict();

export const emergencyPlanSchema = z
  .object({
    availableHours: z.coerce.number().min(1).max(72).default(8),
    sleepHours: z.coerce.number().min(4).max(10).default(7),
    addToTimetable: z.boolean().optional(),
  })
  .strict();

export type AiTutorInput = z.infer<typeof aiTutorSchema>;
export type AssignmentHelperInput = z.infer<typeof assignmentHelperSchema>;
export type QuestionPaperInput = z.infer<typeof questionPaperSchema>;
export const studyBuddyActionSchema = z
  .object({
    action: z.enum([
      "generate_plan",
      "generate_session",
      "quick_revision",
      "continue_session",
      "complete_session",
      "complete_item",
      "chat",
      "save_chat",
    ]),
    itemId: z.string().cuid().optional(),
    conversationId: z.string().cuid().optional(),
    message: z.string().trim().min(1).max(4000).optional(),
    plannedMinutes: z.coerce.number().int().min(15).max(60).optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.action === "complete_item" && !value.itemId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "itemId is required",
        path: ["itemId"],
      });
    }
    if (value.action === "chat" && !value.message) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "message is required",
        path: ["message"],
      });
    }
    if (value.action === "save_chat" && !value.conversationId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "conversationId is required",
        path: ["conversationId"],
      });
    }
  });

export type EmergencyPlanInput = z.infer<typeof emergencyPlanSchema>;
export type StudyBuddyActionInput = z.infer<typeof studyBuddyActionSchema>;
