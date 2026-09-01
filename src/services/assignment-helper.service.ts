import type { AssignmentDraftMode } from "@prisma/client";
import { prisma } from "@/lib/db";
import { completeChat } from "@/services/ai/provider";
import { buildStudentAiContext } from "@/services/ai/context";
import type { AssignmentHelperInput } from "@/lib/validations/ai-tools";

const INTEGRITY = `
---
### Academic integrity notice
- Review and edit this output before submitting.
- Verify factual claims with your textbooks and class notes.
- Follow your teacher’s instructions and required format.
- Rewrite key sections in your own voice.
- Add only real sources you actually used — never invent citations.
`;

function rulesDraft(input: AssignmentHelperInput): string {
  const mode = input.mode;
  const header = [
    `# ${input.title}`,
    input.subject ? `**Subject:** ${input.subject}` : null,
    input.marks != null ? `**Marks:** ${input.marks}` : null,
    input.wordLimit != null ? `**Word limit:** ~${input.wordLimit}` : null,
    "",
    `## Question`,
    input.question,
  ]
    .filter(Boolean)
    .join("\n");

  if (mode === "OUTLINE") {
    return [
      header,
      "",
      "## Outline",
      "1. Introduction — define scope and thesis",
      "2. Key concept 1 — explanation + example",
      "3. Key concept 2 — explanation + example",
      "4. Application / analysis",
      "5. Conclusion — summary + takeaway",
      input.citationStyle
        ? `6. References — use real sources in ${input.citationStyle} (do not invent)`
        : "6. References — only if required; use real sources only",
      INTEGRITY,
    ].join("\n");
  }

  if (mode === "PRESENTATION") {
    return [
      header,
      "",
      "## Presentation outline",
      "- Slide 1: Title + your name",
      "- Slide 2: Problem / question",
      "- Slide 3–5: Core points with one example each",
      "- Slide 6: Summary",
      "- Slide 7: Possible viva questions",
      INTEGRITY,
    ].join("\n");
  }

  if (mode === "VIVA_PREP") {
    return [
      header,
      "",
      "## Short explanation of the answer",
      "Explain the core idea in 4–6 sentences using your notes.",
      "",
      "## Likely viva questions",
      "1. What is the main definition involved?",
      "2. Why does this approach work?",
      "3. Give one real-world example.",
      "4. What are common mistakes students make?",
      "5. How would you extend this topic?",
      INTEGRITY,
    ].join("\n");
  }

  const body = [
    "## Introduction",
    `This response addresses: ${input.question.slice(0, 180)}${input.question.length > 180 ? "…" : ""}`,
    "",
    "## Main discussion",
    "### Point 1",
    "Explain the first core idea with a short example.",
    "",
    "### Point 2",
    "Explain the second core idea and connect it to Point 1.",
    "",
    "### Point 3",
    "Add analysis, comparison, or application as required by the question.",
    "",
    "## Conclusion",
    "Summarize the answer and restate the takeaway in one paragraph.",
  ];

  if (mode === "EXAM_STYLE") {
    return [header, "", "## Exam-style answer", ...body, INTEGRITY].join("\n");
  }

  if (mode === "FULL_DRAFT") {
    return [
      header,
      "",
      "## Full draft (edit before use)",
      ...body,
      "",
      "## Optional references",
      "_List only sources you actually consulted. Do not invent citations._",
      INTEGRITY,
    ].join("\n");
  }

  return [
    header,
    "",
    "## Guided draft",
    "_Fill each section with details from your notes._",
    ...body,
    INTEGRITY,
  ].join("\n");
}

export async function generateAssignmentDraft(
  userId: string,
  input: AssignmentHelperInput
) {
  const context = await buildStudentAiContext(userId);
  const system = `You are an Assignment Helper for students. Produce structured markdown for mode ${input.mode}. Help the student learn — do not encourage blind submission. Never invent citations or fake references. If citation style is requested, describe how to cite real sources only. Follow the LANGUAGE RULE in the student context for the draft language (keep code/technical terms natural). Student context:\n${context}`;

  const userPrompt = JSON.stringify(input);
  const { text, provider } = await completeChat({
    system,
    user: userPrompt,
    maxTokens: 1800,
  });

  const output = `${text || rulesDraft(input)}\n${text ? INTEGRITY : ""}`;

  const draft = await prisma.assignmentDraft.create({
    data: {
      userId,
      assignmentId: input.assignmentId || null,
      title: input.title,
      subject: input.subject || null,
      institution: input.institution || null,
      course: input.course || null,
      semester: input.semester || null,
      question: input.question,
      marks: input.marks ?? null,
      wordLimit: input.wordLimit ?? null,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      format: input.format || null,
      instructions: input.instructions || null,
      citationStyle: input.citationStyle || null,
      language: input.language || null,
      difficulty: input.difficulty || null,
      mode: input.mode as AssignmentDraftMode,
      output,
    },
  });

  return { draft, provider };
}

export async function listAssignmentDrafts(userId: string) {
  return prisma.assignmentDraft.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 30,
  });
}

export async function updateAssignmentDraftOutput(
  userId: string,
  id: string,
  output: string
) {
  const row = await prisma.assignmentDraft.findFirst({ where: { id, userId } });
  if (!row) throw new Error("NOT_FOUND");
  return prisma.assignmentDraft.update({
    where: { id },
    data: { output },
  });
}
