import type { PaperMode, QuestionType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { completeChat } from "@/services/ai/provider";
import type { QuestionPaperInput } from "@/lib/validations/ai-tools";
import { getProfileForUser } from "@/services/profile.service";
import { explanationLanguageRule } from "@/services/ai/context";
import { z } from "zod";

const aiQuestionsSchema = z.object({
  instructions: z.string().optional(),
  questions: z
    .array(
      z.object({
        type: z.string(),
        prompt: z.string(),
        options: z.array(z.string()).optional(),
        answer: z.string().optional(),
        explanation: z.string().optional(),
        marks: z.number().int().positive().optional(),
      })
    )
    .min(1),
});

function marksForType(type: string): number {
  switch (type) {
    case "LONG":
    case "CASE_STUDY":
    case "CODING":
      return 10;
    case "SHORT":
    case "NUMERICAL":
    case "PRACTICAL":
      return 5;
    case "VIVA":
    case "VERY_SHORT":
      return 3;
    default:
      return 1;
  }
}

function buildRulesQuestions(input: QuestionPaperInput) {
  const topics =
    input.topics?.split(/[,;\n]/).map((t) => t.trim()).filter(Boolean) ||
    [input.chapter || input.unit || input.subject];
  const types = input.types;
  const questions = [];

  for (let i = 0; i < input.questionCount; i++) {
    const type = types[i % types.length];
    const topic = topics[i % topics.length];
    const marks = marksForType(type);
    let prompt = "";
    let options: string[] | undefined;
    let answer = "";
    const explanation = `Review your notes on ${topic}.`;

    switch (type) {
      case "MCQ":
        prompt = `Which statement best relates to “${topic}”?`;
        options = [
          `A core definition of ${topic}`,
          `An unrelated concept`,
          `A distractor about ${input.subject}`,
          `None of the above`,
        ];
        answer = options[0];
        break;
      case "TRUE_FALSE":
        prompt = `True or False: “${topic}” is an important idea in ${input.subject}.`;
        answer = "True (verify with your syllabus)";
        break;
      case "FILL_BLANK":
        prompt = `Fill in the blank: In ${input.subject}, ______ is central to understanding ${topic}.`;
        answer = `(Student should insert the precise term from notes)`;
        break;
      case "ONE_WORD":
        prompt = `One-word: Name a key term linked to ${topic}.`;
        answer = `(From your chapter notes)`;
        break;
      case "VERY_SHORT":
        prompt = `Define ${topic} in 1–2 sentences.`;
        answer = `A concise definition of ${topic} based on class notes.`;
        break;
      case "SHORT":
        prompt = `Explain ${topic} with one example.`;
        answer = `Short explanation of ${topic} with an everyday example.`;
        break;
      case "LONG":
        prompt = `Write a detailed answer on ${topic}, covering definition, explanation, and application.`;
        answer = `Structured long answer covering definition → explanation → example → conclusion.`;
        break;
      case "CODING":
        prompt = `Write a small program/pseudocode related to ${topic} (state assumptions).`;
        answer = `Pseudocode/algorithm steps for ${topic}.`;
        break;
      case "NUMERICAL":
        prompt = `Solve a numerical problem involving ${topic}. Show steps. (Create numbers from your worksheet if needed.)`;
        answer = `Step-by-step numerical solution for ${topic}.`;
        break;
      case "PRACTICAL":
        prompt = `Describe the practical/procedure steps for ${topic}.`;
        answer = `Materials → procedure → observation → result for ${topic}.`;
        break;
      case "VIVA":
        prompt = `Viva: Why is ${topic} important in ${input.subject}?`;
        answer = `Oral-ready short justification.`;
        break;
      case "CASE_STUDY":
        prompt = `Case study: Apply ${topic} to a realistic student/campus scenario and analyze.`;
        answer = `Case analysis with recommendation.`;
        break;
      default:
        prompt = `Write a short note on ${topic}.`;
        answer = `Short note.`;
    }

    questions.push({
      type: type as QuestionType,
      prompt,
      options: options || null,
      answer: input.includeAnswers ? answer : null,
      explanation: input.includeAnswers ? explanation : null,
      marks,
    });
  }

  return questions;
}

export async function generateQuestionPaper(
  userId: string,
  input: QuestionPaperInput
) {
  const syllabusNote = input.topics
    ? "This paper is based on the topics you entered. Official syllabus/exam pattern was not verified by StudentLife AI."
    : "Exact syllabus/exam pattern was not available. Questions are based only on the subject/chapter fields you provided.";

  let questions = buildRulesQuestions(input);
  let provider: "rules" | "openai" | "gemini" = "rules";

  const profile = await getProfileForUser(userId);
  const explanationLang = profile?.preferredExplanationLang || "English";

  const { text, provider: used } = await completeChat({
    system: `Generate an academic question paper as JSON only matching schema {"instructions": string, "questions":[{"type":string,"prompt":string,"options":string[],"answer":string,"explanation":string,"marks":number}]}. Types allowed: ${input.types.join(", ")}. Count: ${input.questionCount}. Subject: ${input.subject}. Topics: ${input.topics || input.chapter || "general"}. Difficulty: ${input.difficulty}. Do not invent institution-specific rules. No markdown. ${explanationLanguageRule(explanationLang)} Write question prompts clearly; put answer and explanation text in ${explanationLang} when includeAnswers-style content is present. Keep technical terms natural in English when clearer.`,
    user: JSON.stringify(input),
    maxTokens: 2500,
  });

  if (text) {
    try {
      const raw = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
      const parsed = aiQuestionsSchema.safeParse(JSON.parse(raw));
      if (parsed.success) {
        questions = parsed.data.questions.slice(0, input.questionCount).map((q) => ({
          type: (input.types.includes(q.type as never)
            ? q.type
            : input.types[0]) as QuestionType,
          prompt: q.prompt,
          options: q.options || null,
          answer: input.includeAnswers ? q.answer || null : null,
          explanation: input.includeAnswers ? q.explanation || null : null,
          marks: q.marks || marksForType(q.type),
        }));
        provider = used === "rules" ? "rules" : used;
      }
    } catch {
      // keep rules questions
    }
  }

  const totalMarks =
    input.totalMarks ?? questions.reduce((s, q) => s + q.marks, 0);

  const paper = await prisma.generatedQuestionPaper.create({
    data: {
      userId,
      title: input.title,
      institution: input.institution || null,
      course: input.course || null,
      semester: input.semester || null,
      subject: input.subject,
      unit: input.unit || null,
      chapter: input.chapter || null,
      topics: input.topics || null,
      mode: input.mode as PaperMode,
      difficulty: input.difficulty,
      durationMinutes: input.durationMinutes ?? null,
      totalMarks,
      includeAnswers: input.includeAnswers,
      instructions:
        `Answer all questions. Manage time carefully. Total marks: ${totalMarks}.` +
        (input.durationMinutes ? ` Duration: ${input.durationMinutes} minutes.` : ""),
      syllabusNote,
      questions: {
        create: questions.map((q, index) => ({
          orderIndex: index,
          type: q.type,
          prompt: q.prompt,
          options: q.options ?? undefined,
          answer: q.answer,
          explanation: q.explanation,
          marks: q.marks,
        })),
      },
    },
    include: { questions: { orderBy: { orderIndex: "asc" } } },
  });

  return { paper, provider };
}

export async function listQuestionPapers(userId: string) {
  return prisma.generatedQuestionPaper.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { questions: true } } },
  });
}

export async function getQuestionPaper(userId: string, id: string) {
  return prisma.generatedQuestionPaper.findFirst({
    where: { id, userId },
    include: { questions: { orderBy: { orderIndex: "asc" } } },
  });
}

export async function updateGeneratedQuestion(
  userId: string,
  paperId: string,
  questionId: string,
  data: {
    prompt?: string;
    answer?: string | null;
    explanation?: string | null;
    marks?: number;
    orderIndex?: number;
  }
) {
  const paper = await prisma.generatedQuestionPaper.findFirst({
    where: { id: paperId, userId },
  });
  if (!paper) throw new Error("NOT_FOUND");
  const q = await prisma.generatedQuestion.findFirst({
    where: { id: questionId, paperId },
  });
  if (!q) throw new Error("NOT_FOUND");
  return prisma.generatedQuestion.update({
    where: { id: questionId },
    data,
  });
}

export async function deleteGeneratedQuestion(
  userId: string,
  paperId: string,
  questionId: string
) {
  const paper = await prisma.generatedQuestionPaper.findFirst({
    where: { id: paperId, userId },
  });
  if (!paper) throw new Error("NOT_FOUND");
  await prisma.generatedQuestion.delete({ where: { id: questionId } });
}

export async function deleteQuestionPaper(userId: string, id: string) {
  const paper = await prisma.generatedQuestionPaper.findFirst({
    where: { id, userId },
  });
  if (!paper) throw new Error("NOT_FOUND");
  await prisma.generatedQuestionPaper.delete({ where: { id } });
}

export async function duplicateQuestionPaper(userId: string, id: string) {
  const paper = await getQuestionPaper(userId, id);
  if (!paper) throw new Error("NOT_FOUND");
  return prisma.generatedQuestionPaper.create({
    data: {
      userId,
      title: `${paper.title} (copy)`,
      institution: paper.institution,
      course: paper.course,
      semester: paper.semester,
      subject: paper.subject,
      unit: paper.unit,
      chapter: paper.chapter,
      topics: paper.topics,
      mode: paper.mode,
      difficulty: paper.difficulty,
      durationMinutes: paper.durationMinutes,
      totalMarks: paper.totalMarks,
      includeAnswers: paper.includeAnswers,
      instructions: paper.instructions,
      syllabusNote: paper.syllabusNote,
      questions: {
        create: paper.questions.map((q) => ({
          orderIndex: q.orderIndex,
          type: q.type,
          prompt: q.prompt,
          options: q.options ?? undefined,
          answer: q.answer,
          explanation: q.explanation,
          marks: q.marks,
        })),
      },
    },
    include: { questions: { orderBy: { orderIndex: "asc" } } },
  });
}
