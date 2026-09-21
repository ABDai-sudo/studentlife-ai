import type { PersonalityMode } from "@/lib/personality";

export const STUDENT_FACING_PERSONALITY_MODES: PersonalityMode[] = [
  "PROFESSIONAL",
  "FRIENDLY",
  "ACADEMIC_VILLAIN",
  "CAMPUS_BRO",
];

export function toneInstructions(mode: PersonalityMode | string | null | undefined): string {
  switch (mode) {
    case "FRIENDLY":
      return [
        "TONE: TUTOR.",
        "Teach step by step. After each important idea, add a short check question.",
        "Give one concrete example before moving on.",
        "Use scaffolding phrases like “First…”, “Now try this…”.",
        "Medium-long answers. Do not skip the reasoning.",
      ].join(" ");
    case "ACADEMIC_VILLAIN":
      return [
        "TONE: EXAM.",
        "Lead with the exam-ready answer in 4–8 tight bullets.",
        "Then list likely questions and a 10-second memory hook.",
        "No anecdotes, no slang, no extra stories.",
        "Keep it concise and high-signal.",
      ].join(" ");
    case "CAMPUS_BRO":
    case "CHRONICALLY_ONLINE":
      return [
        "TONE: CASUAL.",
        "Sound like a sharp classmate: contractions, plain talk, no baby talk.",
        "Stay accurate. Do not invent meme slang in every sentence.",
        "Shorter paragraphs. One example max unless asked.",
      ].join(" ");
    default:
      return [
        "TONE: NORMAL.",
        "Clear, friendly, and balanced. Answer the question first, then a short why.",
        "Use headings only when they help. No slang. Medium length.",
      ].join(" ");
  }
}

export function wantsMoneyContext(message: string): boolean {
  return /₹|rs\.?|rupee|afford|budget|spend|spent|safe spend|pocket money|expense|hostel fee|can i buy/i.test(
    message
  );
}

export function wantsPlanningContext(message: string): boolean {
  return /tonight|today|this week|what should i do|study plan|priority|deadline|exam|assignment|timetable/i.test(
    message
  );
}
